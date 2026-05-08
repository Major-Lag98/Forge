find_package(GTest CONFIG REQUIRED)
find_package(httplib CONFIG REQUIRED)

add_executable(forge_core_tests
  test_sanity.cpp
  test_protocol.cpp
  test_hash.cpp
  test_archive.cpp
  test_http.cpp
)
target_link_libraries(forge_core_tests PRIVATE
  forge_protocol
  GTest::gtest
  GTest::gtest_main
  httplib::httplib
)

include(GoogleTest)
gtest_discover_tests(forge_core_tests)
