#include "protocol.h"

#include "launch.h"

#include <filesystem>
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
    if (op == "launch") {
        if (!request.contains("executable") || !request.at("executable").is_string()) {
            return {{"error", "launch requires string field 'executable'"}};
        }
        const auto exe = request.at("executable").get<std::string>();
        const auto result = launch(std::filesystem::path(exe));
        if (!result) {
            return {{"error", result.error()}};
        }
        return {{"exit_code", result.value()}};
    }
    return {{"error", "unknown op"}};
}

}
