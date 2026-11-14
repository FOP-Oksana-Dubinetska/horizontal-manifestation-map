#include "composition-root.hpp"
#include <catch2/catch_test_macros.hpp>
#include <sstream>
#include <string>
#include <vector>

// Каждый тест проверяет внешний контракт: результат, stdout и stderr.
TEST_CASE("CLI help aliases and no arguments", "[cli]") {
  for (const std::string argument : {"", "help", "--help", "-h"}) {
    std::vector<std::string> args{"hmap"};
    if (!argument.empty()) args.push_back(argument);
    std::vector<char*> pointers;
    for (auto& value : args) pointers.push_back(value.data());
    std::ostringstream output, errors;
    CHECK(roadmap::cli::runCli(static_cast<int>(pointers.size()), pointers.data(), output, errors) == 0);
    CHECK(output.str().starts_with("Usage: hmap"));
    CHECK(errors.str().empty());
  }
}

TEST_CASE("CLI version is four stable lines", "[cli]") {
  char name[] = "hmap", version[] = "--version";
  char* args[]{name, version};
  std::ostringstream output, errors;
  CHECK(roadmap::cli::runCli(2, args, output, errors) == 0);
  CHECK(output.str() == "hmap 0.0.0\nschema 2\nRoadmapText 1\nAPI 1\n");
  CHECK(errors.str().empty());
}

TEST_CASE("CLI invalid arguments preserve stdout", "[cli]") {
  for (std::vector<std::string> args : {
      std::vector<std::string>{"hmap", "--unknown"},
      {"hmap", "unknown"}, {"hmap", "--version", "extra"}}) {
    std::vector<char*> pointers;
    for (auto& value : args) pointers.push_back(value.data());
    std::ostringstream output, errors;
    CHECK(roadmap::cli::runCli(static_cast<int>(args.size()), pointers.data(), output, errors) == 2);
    CHECK(output.str().empty());
    CHECK_FALSE(errors.str().empty());
  }
}
