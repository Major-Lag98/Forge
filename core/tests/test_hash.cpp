#include <gtest/gtest.h>

#include "hash.h"

#include <filesystem>
#include <fstream>
#include <string>

namespace fs = std::filesystem;

namespace {

fs::path unique_tmp_path() {
    const auto* info = ::testing::UnitTest::GetInstance()->current_test_info();
    return fs::temp_directory_path() /
           (std::string("forge_") + info->test_suite_name() + "_" + info->name());
}

}

TEST(Hash, EmptyFileMatchesKnownDigest) {
    const auto path = unique_tmp_path();
    fs::create_directories(path.parent_path());
    std::ofstream(path).close();

    const auto result = forge::sha256_of_file(path);
    ASSERT_TRUE(result.has_value()) << result.error();
    EXPECT_EQ(result.value(),
              "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

    fs::remove(path);
}

TEST(Hash, KnownContentMatchesPrecomputedDigest) {
    const auto path = unique_tmp_path();
    fs::create_directories(path.parent_path());
    {
        std::ofstream out(path, std::ios::binary);
        out.write("hello", 5);
    }

    const auto result = forge::sha256_of_file(path);
    ASSERT_TRUE(result.has_value()) << result.error();
    EXPECT_EQ(result.value(),
              "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");

    fs::remove(path);
}

TEST(Hash, MissingFileReturnsError) {
    const auto path = fs::temp_directory_path() / "forge_hash_definitely_missing_xyz123.bin";
    fs::remove(path);

    const auto result = forge::sha256_of_file(path);
    EXPECT_FALSE(result.has_value());
}
