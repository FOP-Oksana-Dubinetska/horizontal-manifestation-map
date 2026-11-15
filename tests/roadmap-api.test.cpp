#include "roadmap-api.hpp"
#include "json-project.hpp"
#include <catch2/catch_test_macros.hpp>
#include <nlohmann/json.hpp>
using nlohmann::json;
namespace {
json request(const std::string &op, json options = json::object(), bool input = true) {
	json r = {{"apiVersion", 1}, {"requestId", "same-001"}, {"operation", op}, {"options", options}};
	if (input)
		r["input"] = {{"format", "json"}, {"text", roadmap::formats::projectTemplate()}};
	return json::parse(roadmap::processRoadmapRequest(r.dump()));
}
} // namespace
TEST_CASE("Common API validates and reflects request identity", "[api]") {
	auto result = request("validate");
	CHECK(result["ok"] == true);
	CHECK(result["requestId"] == "same-001");
	CHECK(result["result"]["schemaVersion"] == 2);
	CHECK(request("inspect", {{"id", "m-validator"}})["ok"] == true);
	CHECK(request("render", {{"format", "json"}})["result"]["rows"][0]["route"]["steps"].size() == 3);
	CHECK(request("validate", {{"routeId", "r-check"}})["diagnostics"][0]["code"] == "E_COMMAND");
	CHECK(request("template", {{"format", "roadmap-text"}}, false)["result"]["text"]
	          .get<std::string>()
	          .starts_with("!roadmap-text 1"));
}
TEST_CASE("Guidance is trilingual and retains unknown reasons", "[api]") {
	for (const auto *language : {"en", "uk", "ru"}) {
		for (const auto *topic :
		     {"getting-started", "commands", "json", "roadmap-text", "llm", "intents", "routes",
		      "reuse", "estimates", "continuous-intents", "references", "storage", "export", "wasm",
		      "intersections", "workflow"})
			CHECK(request("help", {{"topic", topic}, {"language", language}}, false)["ok"] == true);
		auto hints = request("hints", {{"language", language}, {"format", "json"}});
		CHECK(hints["result"]["items"].size() == 1);
		CHECK(hints["result"]["items"][0]["reason"].get<std::string>().size() > 0);
	}
}
TEST_CASE("Intersection source diagnostics explain the minimum in every locale",
          "[api][workflow]") {
	for (const auto *language : {"en", "uk", "ru"}) {
		auto p = json::parse(roadmap::formats::projectTemplate());
		p["intersections"].push_back(
		    {{"id", "x-test"}, {"title", "Relation"}, {"note", ""}, {"sourceIds", json::array()}});
		auto response = json::parse(roadmap::processRoadmapRequest(json{
		    {"apiVersion", 1},
		    {"operation", "validate"},
		    {"options", {{"language", language}}},
		    {"input", {{"format", "json"}, {"text", p.dump()}}}}.dump()));
		CHECK(response["ok"] == false);
		CHECK(response["diagnostics"][0]["message"].get<std::string>().find("sourceIds") !=
		      std::string::npos);
		CHECK(response["diagnostics"][0]["pointer"] == "/intersections/0/sourceIds");
	}
}
