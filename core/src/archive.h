#pragma once

#include <expected>
#include <filesystem>
#include <string>

namespace forge {

std::expected<void, std::string> extract_zip(
    const std::filesystem::path& zip_path,
    const std::filesystem::path& dest_dir);

}
