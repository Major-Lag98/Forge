find_package(GTest CONFIG REQUIRED)

add_executable(forge_core_tests
  test_sanity.cpp
  test_protocol.cpp
)
target_link_libraries(forge_core_tests PRIVATE
  forge_protocol
  GTest::gtest
  GTest::gtest_main
)

include(GoogleTest)
gtest_discover_tests(forge_core_tests)
