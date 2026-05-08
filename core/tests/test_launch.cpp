#include <gtest/gtest.h>

#include "launch.h"
#include "test_helper_paths.h"

#include <filesystem>

namespace fs = std::filesystem;

TEST(Launch, ExitZero) {
    const auto result = forge::launch(FORGE_HELPER_ZERO_PATH);
    ASSERT_TRUE(result.has_value()) << result.error();
    EXPECT_EQ(result.value(), 0);
}

TEST(Launch, ExitOne) {
    const auto result = forge::launch(FORGE_HELPER_ONE_PATH);
    ASSERT_TRUE(result.has_value()) << result.error();
    EXPECT_EQ(result.value(), 1);
}

TEST(Launch, MissingExecutableReturnsError) {
    const fs::path missing = fs::temp_directory_path() / "forge_definitely_missing_xyz.exe";
    fs::remove(missing);

    const auto result = forge::launch(missing);
    EXPECT_FALSE(result.has_value());
}
