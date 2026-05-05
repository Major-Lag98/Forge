#include "protocol.h"

#include <string>

namespace forge {

nlohmann::json dispatch(const nlohmann::json& request) {
    if (!request.contains("op") || !request.at("op").is_string()) {
        return {{"error", "missing or invalid op"}};
    }

    const auto op = request.at("op").get<std::string>();
    if (op == "ping") {
        return {{"pong", true}};
    }
    return {{"error", "unknown op"}};
}

}
