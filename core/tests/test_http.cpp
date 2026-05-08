#include <gtest/gtest.h>

#include "http.h"

#include <httplib.h>

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

}

class HttpTest : public ::testing::Test {
protected:
    httplib::Server server;
    std::thread server_thread;
    int port = 0;
    fs::path tmp_dir;

    void SetUp() override {
        tmp_dir = unique_tmp_dir();
        fs::create_directories(tmp_dir);

        server.Get("/payload.txt", [](const httplib::Request&, httplib::Response& res) {
            res.set_content("Hello from local server", "text/plain");
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

TEST_F(HttpTest, DownloadsFileFromLocalServer) {
    const std::string url = "http://127.0.0.1:" + std::to_string(port) + "/payload.txt";
    const fs::path dest = tmp_dir / "out.txt";

    const auto result = forge::download(url, dest);
    ASSERT_TRUE(result.has_value()) << result.error();

    std::string content;
    {
        std::ifstream in(dest, std::ios::binary);
        content.assign(std::istreambuf_iterator<char>(in),
                       std::istreambuf_iterator<char>());
    }
    EXPECT_EQ(content, "Hello from local server");
}

TEST_F(HttpTest, ReturnsErrorOnHttp404) {
    const std::string url = "http://127.0.0.1:" + std::to_string(port) + "/missing";
    const fs::path dest = tmp_dir / "out.txt";

    const auto result = forge::download(url, dest);
    EXPECT_FALSE(result.has_value());
}
