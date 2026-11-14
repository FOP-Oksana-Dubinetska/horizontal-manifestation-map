#include "roadmap-text.hpp"
#include <catch2/catch_test_macros.hpp>
using namespace roadmap::formats;
TEST_CASE("RoadmapText round trip preserves author strings and every array order", "[text]") {
	auto original = readJsonProject(projectTemplate());
	REQUIRE(original.project);
	original.project->chunks[0].body = "Кирилиця } [text] -> \\\"\n# ordinary body\n";
	const auto canonical = writeJsonProject(*original.project);
	const auto text = writeTextProject(*original.project);
	const auto parsed = readTextProject(text);
	REQUIRE(parsed.project);
	CHECK(writeJsonProject(*parsed.project) == canonical);
	CHECK(writeTextProject(*parsed.project) == text);
}
TEST_CASE("RoadmapText rejects malformed arrows and duplicate membership", "[text]") {
	auto original = readJsonProject(projectTemplate());
	REQUIRE(original.project);
	const auto text = writeTextProject(*original.project);
	auto bad = text;
	auto where = bad.find("[s-intent] ->");
	bad.replace(where, 12, "[s-intent] -> ->");
	CHECK_FALSE(readTextProject(bad).project);
	bad = text;
	where = bad.find("[s-intent] ->");
	bad.insert(where, "[s-intent] -> ");
	auto result = readTextProject(bad);
	CHECK_FALSE(result.project);
	CHECK(result.diagnostics.front().code == "E_ROUTE_MEMBERSHIP");
}
TEST_CASE("RoadmapText permits comments, Unicode arrows and empty route", "[text]") {
	auto original = readJsonProject(projectTemplate());
	REQUIRE(original.project);
	auto text = writeTextProject(*original.project);
	auto arrow = text.find(" -> ");
	text.replace(arrow, 4, " → ");
	CHECK(readTextProject("# comment\n" + text).project.has_value());
	original.project->routes[0].steps.clear();
	CHECK(readTextProject(writeTextProject(*original.project)).project.has_value());
}
