#include <gtest/gtest.h>

#include "install.h"

#include <httplib.h>
#include <picosha2.h>
#include <zip.h>

#include <chrono>
#include <filesystem>
#include <fstream>
#include <string>
#include <thread>

namespace fs = std::filesystem;

namespace {

fs::path unique_tmp_dir() {
    const auto* info = ::testing::UnitTest::GetInstance()->current_test_info();
    return fs::temp_directory_path() /
           (std::string("forge_") + info->test_suite_name() + "_" + info->name());
}

std::string build_zip_payload() {
    const auto temp_zip = fs::temp_directory_path() / "forge_install_test_payload.zip";
    fs::remove(temp_zip);

    zip_t* zip = zip_open(temp_zip.string().c_str(), ZIP_CREATE | ZIP_TRUNCATE, nullptr);
    if (!zip) return {};

    static const std::string content = "Hello from installed game";
    zip_source_t* source = zip_source_buffer(zip, content.data(), content.size(), 0);
    if (!source) {
        zip_close(zip);
        return {};
    }
    zip_file_add(zip, "game.exe", source, ZIP_FL_OVERWRITE);
    zip_close(zip);

    std::string data;
    {
        std::ifstream in(temp_zip, std::ios::binary);
        data.assign(std::istreambuf_iterator<char>(in),
                    std::istreambuf_iterator<char>());
    }
    fs::remove(temp_zip);
    return data;
}

std::string sha256_hex(const std::string& data) {
    std::string hex;
    picosha2::hash256_hex_string(data, hex);
    return hex;
}

}

class InstallTest : public ::testing::Test {
protected:
    httplib::Server server;
    std::thread server_thread;
    int port = 0;
    fs::path tmp_dir;
    std::string zip_payload;
    std::string zip_sha256;

    void SetUp() override {
        tmp_dir = unique_tmp_dir();
        fs::create_directories(tmp_dir);

        zip_payload = build_zip_payload();
        ASSERT_FALSE(zip_payload.empty());
        zip_sha256 = sha256_hex(zip_payload);

        server.Get("/payload.zip", [this](const httplib::Request&, httplib::Response& res) {
            res.set_content(zip_payload, "application/zip");
        });
        server.Get("/missing", [](const httplib::Request&, httplib::Response& res) {
            res.status = 404;
        });

        port = server.bind_to_any_port("127.0.0.1");
        ASSERT_GT(port, 0);

        server_thread = std::thread([this] { server.listen_after_bind(); });

        for (int i = 0; i < 50 && !server.is_running(); ++i) {
            std::this_thread::sleep_for(std::chrono::milliseconds(20));
        }
        ASSERT_TRUE(server.is_running());
    }

    void TearDown() override {
        server.stop();
        if (server_thread.joinable()) server_thread.join();
        fs::remove_all(tmp_dir);
    }
};

TEST_F(InstallTest, InstallsAndExtractsZip) {
    const std::string url = "http://127.0.0.1:" + std::to_string(port) + "/payload.zip";
    const fs::path install_dir = tmp_dir / "installed";

    const auto result = forge::install(url, zip_sha256, install_dir);
    ASSERT_TRUE(result.has_value()) << result.error();

    ASSERT_TRUE(fs::exists(install_dir / "game.exe"));

    std::string content;
    {
        std::ifstream in(install_dir / "game.exe", std::ios::binary);
        content.assign(std::istreambuf_iterator<char>(in),
                       std::istreambuf_iterator<char>());
    }
    EXPECT_EQ(content, "Hello from installed game");
}

TEST_F(InstallTest, ReturnsErrorOnSha256Mismatch) {
    const std::string url = "http://127.0.0.1:" + std::to_string(port) + "/payload.zip";
    const fs::path install_dir = tmp_dir / "installed";
    const std::string wrong_sha(64, 'f');

    const auto result = forge::install(url, wrong_sha, install_dir);
    EXPECT_FALSE(result.has_value());
    EXPECT_FALSE(fs::exists(install_dir / "game.exe"));
}

TEST_F(InstallTest, ReturnsErrorOn404) {
    const std::string url = "http://127.0.0.1:" + std::to_string(port) + "/missing";
    const fs::path install_dir = tmp_dir / "installed";

    const auto result = forge::install(url, zip_sha256, install_dir);
    EXPECT_FALSE(result.has_value());
}
