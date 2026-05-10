#include "protocol.h"

#include "install.h"
#include "launch.h"

#include <filesystem>
#include <string>

namespace forge {

namespace {

const nlohmann::json* require_string(const nlohmann::json& req, const std::string& key) {
    if (!req.contains(key) || !req.at(key).is_string()) return nullptr;
    return &req.at(key);
}

}

nlohmann::json dispatch(const nlohmann::json& request, EmitEvent emit_event) {
    if (!request.contains("op") || !request.at("op").is_string()) {
        return {{"error", "missing or invalid op"}};
    }

    const auto op = request.at("op").get<std::string>();
    if (op == "ping") {
        return {{"pong", true}};
    }
    if (op == "launch") {
        const auto* exe = require_string(request, "executable");
        if (!exe) return {{"error", "launch requires string field 'executable'"}};
        const auto result = launch(std::filesystem::path(exe->get<std::string>()));
        if (!result) {
            return {{"error", result.error()}};
        }
        return {{"exit_code", result.value()}};
    }
    if (op == "install") {
        const auto* url = require_string(request, "url");
        const auto* sha = require_string(request, "expected_sha256");
        const auto* dir = require_string(request, "install_dir");
        if (!url || !sha || !dir) {
            return {{"error", "install requires string fields 'url', 'expected_sha256', 'install_dir'"}};
        }

        ProgressCallback on_progress;
        if (emit_event) {
            on_progress = [&emit_event](int percent) {
                emit_event({{"event", "progress"}, {"phase", "download"}, {"percent", percent}});
            };
        }

        const auto result = install(
            url->get<std::string>(),
            sha->get<std::string>(),
            std::filesystem::path(dir->get<std::string>()),
            on_progress);
        if (!result) {
            return {{"error", result.error()}};
        }
        return {{"installed", true}};
    }
    return {{"error", "unknown op"}};
}

}
