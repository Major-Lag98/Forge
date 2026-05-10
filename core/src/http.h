#pragma once

#include <expected>
#include <filesystem>
#include <functional>
#include <string>

namespace forge {

using ProgressCallback = std::function<void(int percent)>;

std::expected<void, std::string> download(
    const std::string& url,
    const std::filesystem::path& dest,
    ProgressCallback on_progress = {});

}
