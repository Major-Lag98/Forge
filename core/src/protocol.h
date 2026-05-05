#pragma once

#include <nlohmann/json.hpp>

namespace forge {

nlohmann::json dispatch(const nlohmann::json& request);

}
