#include "hash.h"

#include <picosha2.h>

#include <array>
#include <fstream>

namespace forge {

std::expected<std::string, std::string> sha256_of_file(const std::filesystem::path& path) {
    std::ifstream in(path, std::ios::binary);
    if (!in) {
        return std::unexpected("Failed to open file: " + path.string());
    }

    picosha2::hash256_one_by_one hasher;
    std::array<char, 64 * 1024> buffer{};
    while (in) {
        in.read(buffer.data(), buffer.size());
        const auto count = in.gcount();
        if (count > 0) {
            hasher.process(buffer.begin(), buffer.begin() + count);
        }
    }
    hasher.finish();

    std::string hex;
    picosha2::get_hash_hex_string(hasher, hex);
    return hex;
}

}
