#include "http.h"

#include <cpr/cpr.h>

#include <fstream>
#include <system_error>

namespace forge {

std::expected<void, std::string> download(
    const std::string& url,
    const std::filesystem::path& dest) {
    const auto response = cpr::Get(cpr::Url{url});

    if (response.error) {
        return std::unexpected("HTTP error: " + response.error.message);
    }
    if (response.status_code < 200 || response.status_code >= 300) {
        return std::unexpected("HTTP " + std::to_string(response.status_code));
    }

    std::error_code ec;
    if (dest.has_parent_path()) {
        std::filesystem::create_directories(dest.parent_path(), ec);
        if (ec) {
            return std::unexpected("Failed to create destination directory: " + ec.message());
        }
    }

    std::ofstream out(dest, std::ios::binary);
    if (!out) {
        return std::unexpected("Failed to open destination file: " + dest.string());
    }

    out.write(response.text.data(), static_cast<std::streamsize>(response.text.size()));
    if (!out) {
        return std::unexpected("Failed to write to destination file: " + dest.string());
    }

    return {};
}

}
