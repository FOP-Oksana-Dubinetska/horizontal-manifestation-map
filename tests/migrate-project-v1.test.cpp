#include "migrate-project-v1.hpp"
#include <catch2/catch_test_macros.hpp>
#include <fstream>
#include <iterator>
TEST_CASE("Legacy migration preserves IDs and ambiguous estimate text", "[migration]") {
	std::ifstream input(std::string(HMAP_SOURCE_DIR) + "/test/fixtures/minimal-v1.roadmap.json");
	const std::string text{std::istreambuf_iterator<char>(input), {}};
	auto result = roadmap::formats::migrateProjectV1(text);
	REQUIRE(result.project);
	CHECK(result.project->selectedRouteId == "r-check");
	CHECK(std::get<roadmap::EstimateText>(result.project->estimates[0].value).text == "2–4 d");
	CHECK(result.project->metadata.createdAt == "2026-06-21T00:00:00Z");
	CHECK_FALSE(result.migrationReport.empty());
	auto source = nlohmann::json::parse(text);
	source["routes"][0]["steps"][1]["order"] = 0;
	CHECK_FALSE(roadmap::formats::migrateProjectV1(source.dump()).project);
	source = nlohmann::json::parse(text);
	source["intents"][0]["kind"] = "finite";
	CHECK_FALSE(roadmap::formats::migrateProjectV1(source.dump()).project);
}
