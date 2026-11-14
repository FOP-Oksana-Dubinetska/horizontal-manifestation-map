#include "json-project.hpp"
#include <catch2/catch_test_macros.hpp>
using namespace roadmap::formats;
TEST_CASE("JSON project has a lossless canonical round trip", "[json]") {
	auto result = readJsonProject(projectTemplate());
	REQUIRE(result.project);
	auto canonical = writeJsonProject(*result.project);
	auto again = readJsonProject(canonical);
	REQUIRE(again.project);
	CHECK(writeJsonProject(*again.project) == canonical);
}
TEST_CASE("Strict JSON rejects duplicate keys, extensions and malformed text", "[json]") {
	for (const auto &text : {"{\"id\":1,\"id\":2}", "{} garbage", "{\"x\":NaN}", "{\"x\":1,}"}) {
		auto result = readJsonProject(text);
		CHECK_FALSE(result.project);
		CHECK(result.hasErrors());
	}
	auto text = projectTemplate();
	text.insert(text.find('{') + 1, "\"surprise\":42,");
	auto result = readJsonProject(text);
	CHECK_FALSE(result.project);
	CHECK(result.diagnostics.front().code == "E_FIELD_UNKNOWN");
}
TEST_CASE("JSON input bounds and encoding are checked", "[json]") {
	CHECK(readJsonProject(std::string(8388609, ' ')).diagnostics.front().code == "E_INPUT_LIMIT");
	auto text = projectTemplate();
	text.insert(text.find("title") + 8, 1, static_cast<char>(0xff));
	CHECK(readJsonProject(text).diagnostics.front().code == "E_INPUT_ENCODING");
	CHECK(readJsonProject("\xEF\xBB\xBF" + projectTemplate()).project.has_value());
}
