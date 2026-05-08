#include "archive.h"

#include <zip.h>

#include <array>
#include <fstream>
#include <string>
#include <system_error>

namespace forge {

namespace {

bool is_safe_zip_entry(const std::string& name) {
    if (name.empty()) return false;
    if (name.front() == '/' || name.front() == '\\') return false;
    if (name.size() >= 2 && name[1] == ':') return false; // Windows drive letter
    const std::filesystem::path p(name);
    for (const auto& seg : p) {
        if (seg == "..") return false;
    }
    return true;
}

}

std::expected<void, std::string> extract_zip(
    const std::filesystem::path& zip_path,
    const std::filesystem::path& dest_dir) {
    int error_code = 0;
    zip_t* zip = zip_open(zip_path.string().c_str(), ZIP_RDONLY, &error_code);
    if (!zip) {
        zip_error_t err;
        zip_error_init_with_code(&err, error_code);
        std::string msg = "Failed to open zip: ";
        msg += zip_error_strerror(&err);
        zip_error_fini(&err);
        return std::unexpected(msg);
    }

    std::error_code ec;
    std::filesystem::create_directories(dest_dir, ec);
    if (ec) {
        zip_close(zip);
        return std::unexpected("Failed to create destination directory: " + ec.message());
    }

    const auto num_entries = zip_get_num_entries(zip, 0);
    for (zip_int64_t i = 0; i < num_entries; ++i) {
        const char* raw_name = zip_get_name(zip, i, 0);
        if (!raw_name) {
            zip_close(zip);
            return std::unexpected("zip_get_name failed");
        }
        const std::string name = raw_name;

        if (!is_safe_zip_entry(name)) {
            zip_close(zip);
            return std::unexpected("Unsafe path in zip: " + name);
        }

        const std::filesystem::path entry_path = dest_dir / name;

        if (!name.empty() && name.back() == '/') {
            std::filesystem::create_directories(entry_path, ec);
            if (ec) {
                zip_close(zip);
                return std::unexpected("Failed to create directory: " + ec.message());
            }
            continue;
        }

        if (entry_path.has_parent_path()) {
            std::filesystem::create_directories(entry_path.parent_path(), ec);
            if (ec) {
                zip_close(zip);
                return std::unexpected("Failed to create parent directory: " + ec.message());
            }
        }

        zip_file_t* zf = zip_fopen_index(zip, i, 0);
        if (!zf) {
            zip_close(zip);
            return std::unexpected("Failed to open zip entry: " + name);
        }

        std::ofstream out(entry_path, std::ios::binary);
        if (!out) {
            zip_fclose(zf);
            zip_close(zip);
            return std::unexpected("Failed to open destination file: " + entry_path.string());
        }

        std::array<char, 64 * 1024> buffer{};
        zip_int64_t bytes_read = 0;
        while ((bytes_read = zip_fread(zf, buffer.data(), buffer.size())) > 0) {
            out.write(buffer.data(), bytes_read);
            if (!out) {
                zip_fclose(zf);
                zip_close(zip);
                return std::unexpected("Failed to write to destination file: " + entry_path.string());
            }
        }

        if (bytes_read < 0) {
            zip_fclose(zf);
            zip_close(zip);
            return std::unexpected("Read error from zip entry: " + name);
        }

        zip_fclose(zf);
    }

    zip_close(zip);
    return {};
}

}
