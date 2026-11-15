#include "guidance.hpp"
#include "guidance-resources.hpp"
#include "localization.hpp"
#include <algorithm>
#include <map>
#include <stdexcept>
namespace roadmap::guidance {
using nlohmann::json;
json catalog() {
	static const auto data = [] {
		auto result = json::parse(sourceCatalog);
		for (const auto *language : {"en", "uk", "ru"}) {
			const auto copy = formats::locale(language).at("guidance");
			for (auto &entry : result["entries"])
				entry[language] = copy["entries"].at(entry["id"].get<std::string>());
			for (auto it = copy["codes"].begin(); it != copy["codes"].end(); ++it)
				result["codes"][it.key()][language] = it.value();
			result["labels"][language] = copy["labels"];
		}
		return result;
	}();
	return data;
}
json help(const std::string &topic, const std::string &language, const std::string &profile) {
	const auto data = catalog();
	for (const auto &entry : data["entries"])
		if (entry["id"] == "help-" + topic)
			return {{"labels", data["labels"][language][profile]},
			        {"language", language},
			        {"terminologyProfile", profile},
			        {"id", entry["id"]},
			        {"topic", topic},
			        {"text", entry[language]["explanation"]},
			        {"entry", entry[language]}};
	throw std::invalid_argument("Unknown help topic: " + topic);
}
json explain(const std::string &code, const std::string &language) {
	const auto data = catalog();
	if (!data["codes"].contains(code))
		throw std::invalid_argument("Unknown diagnostic code: " + code);
	return {{"language", language}, {"code", code}, {"text", data["codes"][code][language]}};
}
json hints(const RoadmapProject &project, const std::string &language, const std::string &profile) {
	json items = json::array();
	const auto data = catalog();
	auto add = [&](const std::string &rule, const std::string &id, const std::string &reason = "") {
		for (const auto &entry : data["entries"])
			if (entry["id"] == "hint-" + rule)
				items.push_back({{"id", entry["id"]},
				                 {"entityId", id},
				                 {"topic", entry["topic"]},
				                 {"question", entry[language]["summary"]},
				                 {"reason", reason}});
	};
	std::map<std::string, int> uses;
	for (const auto &route : project.routes)
		for (const auto &step : route.steps)
			for (const auto &id : step.linkedModuleIds)
				++uses[id];
	for (const auto &intent : project.intents) {
		if ((intent.status == IntentStatus::active || intent.status == IntentStatus::implemented) &&
		    intent.acceptanceCriteria.empty())
			add("acceptance", intent.id);
		if (intent.kind == IntentKind::continuous)
			add("continuous", intent.id);
		if (intent.status == IntentStatus::implemented &&
		    !std::any_of(project.chunks.begin(), project.chunks.end(), [&](const auto &c) {
			    return !c.body.empty() && std::find(c.linkedIntentIds.begin(), c.linkedIntentIds.end(),
			                                        intent.id) != c.linkedIntentIds.end();
		    }))
			add("acceptance-evidence", intent.id);
	}
	for (const auto &module : project.modules) {
		if (uses[module.id] > 1)
			add("reuse", module.id);
		if (module.existence == ModuleExistence::existing && module.codeRefs.empty())
			add("code", module.id);
	}
	for (const auto &estimate : project.estimates) {
		if (const auto *unknown = std::get_if<EstimateUnknown>(&estimate.value))
			add("unknown", estimate.id, unknown->reason);
		if (const auto *text = std::get_if<EstimateText>(&estimate.value);
		    text &&
		    (text->text.find('d') != std::string::npos || text->text.find("дн") != std::string::npos))
			add("days", estimate.id, text->text);
	}
	for (const auto &chunk : project.chunks)
		if (chunk.linkedIntentIds.empty() && chunk.linkedModuleIds.empty())
			add("chunk", chunk.id);
	return {{"language", language}, {"terminologyProfile", profile}, {"items", items}};
}
} // namespace roadmap::guidance
