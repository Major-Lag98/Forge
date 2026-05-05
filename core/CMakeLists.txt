find_package(nlohmann_json CONFIG REQUIRED)

add_executable(forge_core src/main.cpp)
target_link_libraries(forge_core PRIVATE nlohmann_json::nlohmann_json)
