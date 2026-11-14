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
