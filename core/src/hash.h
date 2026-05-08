#pragma once

#include <expected>
#include <filesystem>
#include <string>

namespace forge {

std::expected<std::string, std::string> sha256_of_file(const std::filesystem::path& path);

}
