#include "migrate-project-v1.hpp"
#include "embedded-resources.hpp"
#include "strict-json.hpp"
#include <algorithm>
#include <set>
namespace roadmap::formats {
MigrationResult migrateProjectV1(std::string_view text) {
	using nlohmann::json;
	MigrationResult out;
	auto parsed = readStrictJson(text);
	static_cast<DiagnosticReport &>(out) = parsed;
	if (!parsed.value)
		return out;
	auto candidate = *parsed.value;
	auto form = checkJsonShape(candidate, json::parse(resources::legacySchema));
	for (const auto &d : form.diagnostics)
		out.add(d);
	if (out.hasErrors())
		return out;
	auto decision = [&](const std::string &pointer, const std::string &action, const json &value) {
		out.migrationReport.push_back({{"pointer", pointer}, {"action", action}, {"value", value}});
	};
	auto ordered = [&](json &values, const std::string &pointer) {
		std::set<long long> orders;
		for (const auto &value : values)
			if (!orders.insert(value["order"].get<long long>()).second) {
				out.add({"E_FIELD_TYPE",
				         "error",
				         {},
				         pointer,
				         {},
				         "Conflicting legacy order values require an author decision",
				         {},
				         "json"});
				return false;
			}
		std::stable_sort(values.begin(), values.end(), [](const auto &a, const auto &b) {
			return a["order"].template get<long long>() < b["order"].template get<long long>();
		});
		for (auto &value : values)
			value.erase("order");
		decision(pointer, "sorted by unique legacy order; order removed", nullptr);
		return true;
	};
	if (!ordered(candidate["intents"], "/intents"))
		return out;
	for (std::size_t i = 0; i < candidate["intents"].size(); ++i) {
		auto &intent = candidate["intents"][i];
		intent["kind"] = "finite";
		intent["parentIntentIds"] = json::array();
		intent["acceptanceCriteria"] = json::array();
		decision("/intents/" + std::to_string(i),
		         "added finite kind, empty lineage and acceptance criteria",
		         {{"kind", "finite"},
		          {"parentIntentIds", json::array()},
		          {"acceptanceCriteria", json::array()}});
	}
	for (std::size_t r = 0; r < candidate["routes"].size(); ++r) {
		auto &route = candidate["routes"][r];
		if (!ordered(route["steps"], "/routes/" + std::to_string(r) + "/steps"))
			return out;
		for (auto &step : route["steps"])
			if (!step.contains("estimateId")) {
				step["estimateId"] = nullptr;
				decision("/routes/" + std::to_string(r) + "/steps/" + step["id"].get<std::string>() +
				             "/estimateId",
				         "absent optional estimate became null", nullptr);
			}
	}
	for (std::size_t m = 0; m < candidate["modules"].size(); ++m) {
		auto &module = candidate["modules"][m];
		module["existence"] = "planned";
		module["codeRefs"] = json::array();
		decision("/modules/" + std::to_string(m),
		         "legacy existence unknown; planned default requires review",
		         {{"existence", "planned"}, {"codeRefs", json::array()}});
	}
	for (std::size_t e = 0; e < candidate["estimates"].size(); ++e) {
		auto &estimate = candidate["estimates"][e];
		estimate["basis"] = "";
		estimate["value"] = {{"type", "text"}, {"text", estimate["label"]}};
		decision("/estimates/" + std::to_string(e), "label preserved as text; units not inferred",
		         estimate["value"]);
	}
	candidate["selectedRouteId"] = nullptr;
	if (!candidate["selectedIntentId"].is_null()) {
		json routes = json::array();
		for (const auto &route : candidate["routes"])
			if (route["intentId"] == candidate["selectedIntentId"])
				routes.push_back(route["id"]);
		if (routes.size() == 1)
			candidate["selectedRouteId"] = routes[0];
		decision("/selectedRouteId",
		         routes.size() == 1 ? "selected the sole matching route"
		                            : "route remains unselected; author choice required",
		         candidate["selectedRouteId"]);
	}
	candidate["schemaVersion"] = 2;
	candidate["metadata"]["formatVersion"] = "2.0.0";
	decision("/schemaVersion", "explicit schema migration", 2);
	decision("/metadata/formatVersion", "updated format version", "2.0.0");
	const auto result = readJsonProject(candidate.dump());
	for (const auto &d : result.diagnostics)
		out.add(d);
	out.diagnosticsTruncated |= result.diagnosticsTruncated;
	out.containsError |= result.hasErrors();
	if (!out.hasErrors()) {
		out.project = result.project;
		out.add({"W_MIGRATION_DEFAULT",
		         "warning",
		         out.project->id,
		         "",
		         {},
		         "Review reported defaults before accepting the migrated candidate",
		         {},
		         "json"});
	}
	return out;
}
} // namespace roadmap::formats
