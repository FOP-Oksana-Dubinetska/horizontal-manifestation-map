#include "file-output.hpp"
#include <catch2/catch_test_macros.hpp>
#include <filesystem>
#include <fstream>
#include <random>
TEST_CASE("File output preserves existing bytes and rejects input aliases", "[storage]") {
	namespace fs = std::filesystem;
	const auto dir =
	    fs::temp_directory_path() / ("hmap-test-" + std::to_string(std::random_device{}()));
	fs::create_directory(dir);
	struct Guard {
		fs::path p;
		~Guard() {
			fs::remove_all(p);
		}
	} guard{dir};
	const auto path = (dir / "output.json").string();
	REQUIRE_FALSE(roadmap::cli::writeOutputFile(path, "", "first", false));
	auto failure = roadmap::cli::writeOutputFile(path, "", "second", false);
	REQUIRE(failure);
	CHECK(failure->code == "E_OUTPUT_EXISTS");
	std::ifstream input(path);
	std::string content;
	input >> content;
	CHECK(content == "first");
	input.close();
	REQUIRE_FALSE(roadmap::cli::writeOutputFile(path, "", "second", true));
	CHECK(roadmap::cli::writeOutputFile(path, path, "lost", true).has_value());
	CHECK(roadmap::cli::writeOutputFile((dir / "missing" / "output").string(), "", "new", false)
	          .has_value());
	for (const auto &entry : fs::directory_iterator(dir))
		CHECK(entry.path().filename() == "output.json");
}
