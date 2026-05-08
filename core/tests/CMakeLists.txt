find_package(GTest CONFIG REQUIRED)
find_package(httplib CONFIG REQUIRED)

# Tiny test helper executables — used by test_process and test_protocol via
# absolute paths injected at configure time as a generated header.
add_executable(forge_helper_zero helpers/exit_zero.cpp)
add_executable(forge_helper_one helpers/exit_one.cpp)

# Generate a per-config header that exposes the helper paths as raw string
# literals (raw to avoid escaping Windows backslashes). Including $<CONFIG> in
# the output path is required for multi-config generators (Visual Studio)
# because $<TARGET_FILE:...> resolves differently for Debug vs Release.
file(GENERATE
  OUTPUT ${CMAKE_CURRENT_BINARY_DIR}/$<CONFIG>/test_helper_paths.h
  CONTENT
[=[
#pragma once

#define FORGE_HELPER_ZERO_PATH R"($<TARGET_FILE:forge_helper_zero>)"
#define FORGE_HELPER_ONE_PATH R"($<TARGET_FILE:forge_helper_one>)"
]=]
)

add_executable(forge_core_tests
  test_sanity.cpp
  test_protocol.cpp
  test_hash.cpp
  test_archive.cpp
  test_http.cpp
  test_launch.cpp
  test_install.cpp
)
target_link_libraries(forge_core_tests PRIVATE
  forge_protocol
  GTest::gtest
  GTest::gtest_main
  httplib::httplib
)
target_include_directories(forge_core_tests PRIVATE ${CMAKE_CURRENT_BINARY_DIR}/$<CONFIG>)
add_dependencies(forge_core_tests forge_helper_zero forge_helper_one)

include(GoogleTest)
gtest_discover_tests(forge_core_tests)
