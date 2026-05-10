#pragma once

#include <functional>
#include <string>

namespace forge {

// Progress callback invoked during long operations (download, verify, extract).
// `phase` identifies the stage; `percent` is 0..100 within that stage.
using ProgressCallback = std::function<void(const std::string& phase, int percent)>;

}
