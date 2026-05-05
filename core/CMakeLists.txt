find_package(nlohmann_json CONFIG REQUIRED)

add_library(forge_protocol STATIC src/protocol.cpp)
target_include_directories(forge_protocol PUBLIC src)
target_link_libraries(forge_protocol PUBLIC nlohmann_json::nlohmann_json)

add_executable(forge_core src/main.cpp)
target_link_libraries(forge_core PRIVATE forge_protocol)

if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
