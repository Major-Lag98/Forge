#include <gtest/gtest.h>

#include "protocol.h"
#include "test_helper_paths.h"

TEST(Protocol, PingReturnsPong) {
    const nlohmann::json request{{"op", "ping"}};
    const auto response = forge::dispatch(request);
    EXPECT_EQ(response, nlohmann::json({{"pong", true}}));
}

TEST(Protocol, UnknownOpReturnsError) {
    const nlohmann::json request{{"op", "does-not-exist"}};
    const auto response = forge::dispatch(request);
    EXPECT_TRUE(response.contains("error"));
}

TEST(Protocol, MissingOpReturnsError) {
    const nlohmann::json request = nlohmann::json::object();
    const auto response = forge::dispatch(request);
    EXPECT_TRUE(response.contains("error"));
}

TEST(Protocol, LaunchEchoesExitCode) {
    const nlohmann::json request{
        {"op", "launch"},
        {"executable", FORGE_HELPER_ZERO_PATH}
    };
    const auto response = forge::dispatch(request);
    ASSERT_TRUE(response.contains("exit_code")) << response.dump();
    EXPECT_EQ(response.at("exit_code").get<int>(), 0);
}

TEST(Protocol, LaunchMissingExecutableFieldReturnsError) {
    const nlohmann::json request{{"op", "launch"}};
    const auto response = forge::dispatch(request);
    EXPECT_TRUE(response.contains("error"));
}
