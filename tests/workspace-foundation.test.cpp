#include <catch2/catch_test_macros.hpp>

TEST_CASE("stage 00 test harness runs", "[workspace]") {
  REQUIRE(2 + 2 == 4);
}
