#include "protocol.h"

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>

#ifdef _WIN32
  #include <fcntl.h>
  #include <io.h>
#endif

int main() {
#ifdef _WIN32
    _setmode(_fileno(stdin), _O_BINARY);
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    std::string line;
    while (std::getline(std::cin, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
        if (line.empty()) continue;

        nlohmann::json response;
        try {
            const auto request = nlohmann::json::parse(line);
            response = forge::dispatch(request);
        } catch (const nlohmann::json::parse_error& e) {
            response = {{"error", "parse error"}, {"message", e.what()}};
        }

        std::cout << response.dump() << '\n' << std::flush;
    }
    return 0;
}
