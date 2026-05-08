find_package(nlohmann_json CONFIG REQUIRED)
find_package(cpr CONFIG REQUIRED)
find_package(libzip CONFIG REQUIRED)
find_path(PICOSHA2_INCLUDE_DIRS picosha2.h REQUIRED)

add_library(forge_protocol STATIC
  src/protocol.cpp
  src/http.cpp
  src/hash.cpp
  src/archive.cpp
  src/launch.cpp
)
target_include_directories(forge_protocol PUBLIC src ${PICOSHA2_INCLUDE_DIRS})
target_link_libraries(forge_protocol PUBLIC
  nlohmann_json::nlohmann_json
  cpr::cpr
  libzip::zip
)

add_executable(forge_core src/main.cpp)
target_link_libraries(forge_core PRIVATE forge_protocol)

if(BUILD_TESTING)
  add_subdirectory(tests)
endif()
