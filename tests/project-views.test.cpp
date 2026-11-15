#include "project-views.hpp"
#include "json-project.hpp"
#include <catch2/catch_test_macros.hpp>
using namespace roadmap::formats;
TEST_CASE("Route view stays one row and clips complete glyphs", "[views]") {
	auto p = *readJsonProject(projectTemplate()).project;
	RenderOptions options;
	options.width = 40;
	options.unicode = true;
	auto text = renderTerminal(p, options);
	CHECK(isValidUtf8(text));
	CHECK(text.find("s-intent") != std::string::npos);
	options.offset = 20;
	CHECK(isValidUtf8(renderTerminal(p, options)));
	options.fullWidth = true;
	CHECK(renderTerminal(p, options).find("s-export") != std::string::npos);
	p.selectedRouteId.reset();
	CHECK(renderRoute(p, {})["empty"] == true);
}
TEST_CASE("Inspect reports module occurrences independently", "[views]") {
	auto p = *readJsonProject(projectTemplate()).project;
	p.routes[0].steps[0].linkedModuleIds = {"m-validator"};
	auto info = inspectObject(p, "m-validator");
	CHECK(info["object"]["id"] == "m-validator");
	int occurrences = 0;
	for (const auto &use : info["uses"])
		if (!use["routeId"].is_null())
			++occurrences;
	CHECK(occurrences == 2);
	CHECK_THROWS(inspectObject(p, "m-missing"));
	CHECK(safeTerminal("text\x1b[2J") == "text\\x1b[2J");
}
TEST_CASE("The map begins every intention's line before any route exists", "[views][workflow]") {
	auto p = *readJsonProject(projectTemplate()).project;
	const auto original = writeJsonProject(p);
	auto child = p.intents.front();
	child.id = "i-second";
	child.title = "Second intention";
	child.parentIntentIds = {p.intents.front().id};
	p.intents.push_back(child);
	auto alternative = p.routes.front();
	alternative.id = "r-alternative";
	alternative.steps.clear();
	p.routes.push_back(alternative);
	p.selectedIntentId.reset();
	p.selectedRouteId.reset();
	const auto before = writeJsonProject(p);
	const auto map = renderMap(p, {});
	REQUIRE(map["rows"].size() == 3);
	CHECK(map["rows"][0]["route"]["id"] == "r-check");
	CHECK(map["rows"][1]["route"]["id"] == "r-alternative");
	CHECK(map["rows"][2]["intent"]["id"] == "i-second");
	CHECK(map["rows"][2]["route"].is_null());
	CHECK(renderTerminal(p, {}).find("Second intention") != std::string::npos);
	CHECK(writeJsonProject(p) == before);
	CHECK(before != original);
	RenderOptions slice;
	slice.routeId = "r-check";
	CHECK(renderMap(p, slice)["rows"].size() == 1);
	CHECK(renderMap(p, slice)["scope"] == "route");
	slice.routeId = "r-missing";
	CHECK_THROWS(renderMap(p, slice));
	p.routes.clear();
	CHECK(renderMap(p, {})["rows"].size() == 2);
	p.intents.clear();
	CHECK(renderMap(p, {})["empty"] == true);
	RenderOptions uk;
	uk.language = "uk";
	CHECK(renderTerminal(p, uk).find("Почніть із наміру") != std::string::npos);
}
