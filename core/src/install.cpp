#include "install.h"

#include "archive.h"
#include "hash.h"
#include "http.h"

#include <cctype>
#include <filesystem>
#include <string>
#include <string_view>
#include <system_error>

namespace forge {

namespace {

bool ascii_iequals(std::string_view a, std::string_view b) {
    if (a.size() != b.size()) return false;
    for (std::size_t i = 0; i < a.size(); ++i) {
        const auto ca = static_cast<char>(std::tolower(static_cast<unsigned char>(a[i])));
        const auto cb = static_cast<char>(std::tolower(static_cast<unsigned char>(b[i])));
        if (ca != cb) return false;
    }
    return true;
}

}

std::expected<void, std::string> install(
    const std::string& url,
    const std::string& expected_sha256,
    const std::filesystem::path& install_dir) {
    const std::string key =
        install_dir.filename().string().empty()
            ? std::to_string(std::hash<std::string>{}(url))
            : install_dir.filename().string();
    const auto temp_zip = std::filesystem::temp_directory_path() /
                          ("forge_install_" + key + ".zip");

    std::error_code ec;
    std::filesystem::remove(temp_zip, ec);

    if (auto r = download(url, temp_zip); !r) {
        return std::unexpected("Download failed: " + r.error());
    }

    auto hash_result = sha256_of_file(temp_zip);
    if (!hash_result) {
        std::filesystem::remove(temp_zip, ec);
        return std::unexpected("Hash failed: " + hash_result.error());
    }

    if (!ascii_iequals(hash_result.value(), expected_sha256)) {
        std::filesystem::remove(temp_zip, ec);
        return std::unexpected("SHA-256 mismatch: expected " + expected_sha256 +
                               ", got " + hash_result.value());
    }

    if (auto r = extract_zip(temp_zip, install_dir); !r) {
        std::filesystem::remove(temp_zip, ec);
        return std::unexpected("Extract failed: " + r.error());
    }

    std::filesystem::remove(temp_zip, ec);
    return {};
}

}
