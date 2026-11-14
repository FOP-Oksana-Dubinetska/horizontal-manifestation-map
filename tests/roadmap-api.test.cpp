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
	CHECK(request("render", {{"format", "json"}})["result"]["route"]["steps"].size() == 3);
	CHECK(request("validate", {{"routeId", "r-check"}})["diagnostics"][0]["code"] == "E_COMMAND");
	CHECK(request("template", {{"format", "roadmap-text"}}, false)["result"]["text"]
	          .get<std::string>()
	          .starts_with("!roadmap-text 1"));
}
TEST_CASE("Guidance is bilingual and retains unknown reasons", "[api]") {
	for (const auto *language : {"en", "ru"}) {
		for (const auto *topic :
		     {"getting-started", "commands", "json", "roadmap-text", "llm", "intents", "routes",
		      "reuse", "estimates", "continuous-intents", "references", "storage", "export", "wasm"})
			CHECK(request("help", {{"topic", topic}, {"language", language}}, false)["ok"] == true);
		auto hints = request("hints", {{"language", language}, {"format", "json"}});
		CHECK(hints["result"]["items"].size() == 1);
		CHECK(hints["result"]["items"][0]["reason"].get<std::string>().size() > 0);
	}
}
