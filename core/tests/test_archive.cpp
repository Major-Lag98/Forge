#include <gtest/gtest.h>

#include "archive.h"

#include <zip.h>

#include <filesystem>
#include <fstream>
#include <string>

namespace fs = std::filesystem;

namespace {

fs::path unique_tmp_dir() {
    const auto* info = ::testing::UnitTest::GetInstance()->current_test_info();
    return fs::temp_directory_path() /
           (std::string("forge_") + info->test_suite_name() + "_" + info->name());
}

void make_zip_with_entry(
    const fs::path& zip_path,
    const std::string& entry_name,
    const std::string& content) {
    zip_t* zip = zip_open(zip_path.string().c_str(), ZIP_CREATE | ZIP_TRUNCATE, nullptr);
    ASSERT_NE(zip, nullptr);

    zip_source_t* source = zip_source_buffer(zip, content.data(), content.size(), 0);
    ASSERT_NE(source, nullptr);

    const zip_int64_t idx = zip_file_add(zip, entry_name.c_str(), source, ZIP_FL_OVERWRITE);
    ASSERT_GE(idx, 0);

    ASSERT_EQ(zip_close(zip), 0);
}

}

TEST(Archive, ExtractsFileToDestDir) {
    const auto tmp = unique_tmp_dir();
    fs::create_directories(tmp);
    const auto zip_path = tmp / "test.zip";
    const auto dest = tmp / "extracted";

    make_zip_with_entry(zip_path, "hello.txt", "Hello, Forge!");

    const auto result = forge::extract_zip(zip_path, dest);
    ASSERT_TRUE(result.has_value()) << result.error();

    const auto extracted = dest / "hello.txt";
    ASSERT_TRUE(fs::exists(extracted));

    std::string content;
    {
        std::ifstream in(extracted, std::ios::binary);
        content.assign(std::istreambuf_iterator<char>(in),
                       std::istreambuf_iterator<char>());
    }
    EXPECT_EQ(content, "Hello, Forge!");

    fs::remove_all(tmp);
}

TEST(Archive, MissingZipReturnsError) {
    const auto tmp = unique_tmp_dir();
    fs::create_directories(tmp);
    const auto missing = tmp / "missing.zip";
    const auto dest = tmp / "extracted";

    const auto result = forge::extract_zip(missing, dest);
    EXPECT_FALSE(result.has_value());

    fs::remove_all(tmp);
}

TEST(Archive, RejectsPathTraversalEntries) {
    const auto tmp = unique_tmp_dir();
    fs::create_directories(tmp);
    const auto zip_path = tmp / "evil.zip";
    const auto dest = tmp / "extracted";

    make_zip_with_entry(zip_path, "../escape.txt", "evil");

    const auto result = forge::extract_zip(zip_path, dest);
    EXPECT_FALSE(result.has_value());

    fs::remove_all(tmp);
}
