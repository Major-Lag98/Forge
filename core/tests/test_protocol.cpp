#include <gtest/gtest.h>

#include "protocol.h"

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
