#pragma once

#include <nlohmann/json.hpp>

#include <functional>

namespace forge {

using EmitEvent = std::function<void(const nlohmann::json& event)>;

nlohmann::json dispatch(const nlohmann::json& request, EmitEvent emit_event = {});

}
