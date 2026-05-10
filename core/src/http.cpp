#include "http.h"

#include <cpr/cpr.h>

#include <fstream>
#include <system_error>

namespace forge {

std::expected<void, std::string> download(
    const std::string& url,
    const std::filesystem::path& dest,
    ProgressCallback on_progress) {
    int last_percent = -1;

    cpr::Session session;
    session.SetUrl(cpr::Url{url});
    if (on_progress) {
        session.SetProgressCallback(cpr::ProgressCallback(
            [&](cpr::cpr_pf_arg_t down_total,
                cpr::cpr_pf_arg_t down_now,
                cpr::cpr_pf_arg_t /*up_total*/,
                cpr::cpr_pf_arg_t /*up_now*/,
                intptr_t /*userdata*/) -> bool {
                if (down_total > 0) {
                    const auto pct = static_cast<int>(
                        (static_cast<long long>(down_now) * 100) /
                        static_cast<long long>(down_total));
                    if (pct != last_percent) {
                        last_percent = pct;
                        on_progress(pct);
                    }
                }
                return true;
            }));
    }

    const auto response = session.Get();

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
