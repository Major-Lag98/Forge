#pragma once

#include <expected>
#include <filesystem>
#include <string>

namespace forge {

std::expected<int, std::string> launch(
    const std::filesystem::path& executable,
    const std::filesystem::path& working_dir = {});

}
