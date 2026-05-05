#include <nlohmann/json.hpp>
#include <print>

int main() {
    const nlohmann::json hello{{"hello", "forge"}};
    std::println("{}", hello.dump());
    return 0;
}
