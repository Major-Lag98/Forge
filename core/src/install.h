#pragma once

#include "progress.h"

#include <expected>
#include <filesystem>
#include <string>

namespace forge {

std::expected<void, std::string> install(
    const std::string& url,
    const std::string& expected_sha256,
    const std::filesystem::path& install_dir,
    ProgressCallback on_progress = {});

}
