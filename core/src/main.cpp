#include "protocol.h"

#include <nlohmann/json.hpp>

#include <iostream>
#include <string>

#ifdef _WIN32
  #include <fcntl.h>
  #include <io.h>
#endif

namespace {

void write_line(const nlohmann::json& message) {
    std::cout << message.dump() << '\n' << std::flush;
}

}

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

        nlohmann::json id = nullptr;
        nlohmann::json envelope;
        try {
            const auto request = nlohmann::json::parse(line);
            if (request.contains("id")) {
                id = request["id"];
            }

            forge::EmitEvent emit_event = [&id](const nlohmann::json& event) {
                nlohmann::json wrapped = event;
                wrapped["id"] = id;
                write_line(wrapped);
            };

            const auto inner = forge::dispatch(request, emit_event);
            envelope["id"] = id;
            if (inner.contains("error")) {
                envelope["error"] = inner["error"];
            } else {
                envelope["result"] = inner;
            }
        } catch (const nlohmann::json::parse_error& e) {
            envelope = {{"id", id}, {"error", std::string{"parse error: "} + e.what()}};
        }

        write_line(envelope);
    }
    return 0;
}
