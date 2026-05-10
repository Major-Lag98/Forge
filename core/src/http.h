#pragma once

#include "progress.h"

#include <expected>
#include <filesystem>
#include <string>

namespace forge {

std::expected<void, std::string> download(
    const std::string& url,
    const std::filesystem::path& dest,
    ProgressCallback on_progress = {});

}
