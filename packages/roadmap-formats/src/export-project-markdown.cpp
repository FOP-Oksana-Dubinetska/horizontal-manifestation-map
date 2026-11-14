#include "export-project-markdown.hpp"
#include "json-project.hpp"
#include <nlohmann/json.hpp>
#include <set>
#include <stdexcept>
namespace roadmap::formats {
namespace {
std::string heading(const std::string &text) {
	std::string out;
	for (char c : text) {
		if (c == '\r' || c == '\n')
			out += ' ';
		else {
			if (std::string("\\`*_{}[]<>#|!").find(c) != std::string::npos)
				out += '\\';
			out += c;
		}
	}
	return out;
}
std::string link(const std::string &id, bool obsidian) {
	return "[" + id + "](#" + id + ")" + (obsidian ? " ([[#" + id + "]])" : "");
}
} // namespace
std::string exportProjectMarkdown(const RoadmapProject &project,
                                  const std::optional<std::string> &routeId, bool obsidian) {
	using nlohmann::json;
	auto source = json::parse(writeJsonProject(project));
	std::set<std::string> included;
	if (routeId) {
		json selected;
		for (const auto &route : source["routes"])
			if (route["id"] == *routeId)
				selected = route;
		if (selected.is_null())
			throw std::invalid_argument("Route not found: " + *routeId);
		included.insert(selected["intentId"].get<std::string>());
		included.insert(*routeId);
		for (const auto &step : selected["steps"]) {
			included.insert(step["id"].get<std::string>());
			for (const auto *key : {"linkedModuleIds", "linkedChunkIds"})
				for (const auto &id : step[key])
					included.insert(id.get<std::string>());
			if (!step["estimateId"].is_null())
				included.insert(step["estimateId"].get<std::string>());
		}
		source["routes"] = json::array({selected});
	}
	auto visible = [&](const json &item) {
		return !routeId || included.contains(item["id"].get<std::string>());
	};
	std::string out = "---\nartifact_type: \"ironcreed-roadmap-projection\"\nformat_version: "
	                  "\"2.0.0\"\nschema_version: 2\nroadmap_text_version: 1\napi_version: "
	                  "1\nstatus: \"projection\"\nplw_compatible: true\ncontracts_complete: false\n";
	for (const auto *key : {"id", "title", "terminologyProfile"})
		out += std::string(key) + ": " + source[key].dump() + "\n";
	out += "createdAt: " + source["metadata"]["createdAt"].dump() +
	       "\nupdatedAt: " + source["metadata"]["updatedAt"].dump() +
	       "\nmetadata_formatVersion: " + source["metadata"]["formatVersion"].dump() +
	       "\nroute_slice: " + (routeId ? json(*routeId).dump() : "null") + "\n---\n\n# " +
	       heading(project.title) + "\n\n";
	out += routeId
	           ? "Route slice: " + *routeId + ". Other routes and unrelated objects are omitted.\n\n"
	           : "Full project projection.\n\n";
	out += "Canonical source: RoadmapProject JSON schema 2. Estimates remain annotations; a project "
	       "total is undefined. PLW contracts and scenarios require separate review.\n\n";
	auto section = [&](const std::string &label, const json &item, const std::string &titleKey) {
		out += "<a id=\"" + item["id"].get<std::string>() + "\"></a>\n\n## " + label + ": " +
		       heading(item[titleKey].get<std::string>()) + "\n\n";
	};
	auto references = [&](const json &ids) {
		for (const auto &id : ids)
			out += (routeId && !included.contains(id.get<std::string>())
			            ? "`" + id.get<std::string>() + "` (outside slice)"
			            : link(id.get<std::string>(), obsidian)) +
			       " ";
		out += "\n\n";
	};
	for (const auto &intent : source["intents"])
		if (visible(intent)) {
			section("Intent", intent, "title");
			out += intent["summary"].get<std::string>() +
			       "\n\nStatus: " + intent["status"].get<std::string>() +
			       "; kind: " + intent["kind"].get<std::string>() + ".\n\n";
			for (const auto &criterion : intent["acceptanceCriteria"])
				out += "- " + heading(criterion.get<std::string>()) + '\n';
			out += "\nParents: ";
			references(intent["parentIntentIds"]);
		}
	for (const auto &route : source["routes"]) {
		section("Route", route, "title");
		out += "Intent: " + link(route["intentId"].get<std::string>(), obsidian) + "\n\n";
		for (const auto &step : route["steps"]) {
			out += "<a id=\"" + step["id"].get<std::string>() + "\"></a>\n\n### " +
			       heading(step["title"].get<std::string>()) + "\n\n`" + step["id"].get<std::string>() +
			       "` <<" + step["stereotype"].get<std::string>() + ">>\n\nModules: ";
			references(step["linkedModuleIds"]);
			out += "Chunks: ";
			references(step["linkedChunkIds"]);
			out +=
			    "Estimate: " +
			    (step["estimateId"].is_null() ? "-"
			                                  : link(step["estimateId"].get<std::string>(), obsidian)) +
			    "\n\n";
		}
	}
	for (const auto &chunk : source["chunks"])
		if (visible(chunk)) {
			section("Chunk", chunk, "name");
			out += chunk["body"].get<std::string>() + "\n\nIntent links: ";
			references(chunk["linkedIntentIds"]);
			out += "Module links: ";
			references(chunk["linkedModuleIds"]);
		}
	for (const auto &module : source["modules"])
		if (visible(module)) {
			section("Module", module, "title");
			out += module["summary"].get<std::string>() +
			       "\n\nKind: " + module["kind"].get<std::string>() +
			       "; existence: " + module["existence"].get<std::string>() + ".\n\nIntent links: ";
			references(module["linkedIntentIds"]);
			for (const auto &code : module["codeRefs"])
				out += "- Code: " + heading(code.dump()) + '\n';
			out += '\n';
		}
	for (const auto &intersection : source["intersections"])
		if (!routeId) {
			section("Intersection", intersection, "title");
			out += intersection["note"].get<std::string>() + "\n\nSources: ";
			references(intersection["sourceIds"]);
		}
	for (const auto &estimate : source["estimates"])
		if (visible(estimate)) {
			section("Estimate", estimate, "label");
			out += "Confidence: " + estimate["confidence"].get<std::string>() +
			       ".\n\nBasis: " + estimate["basis"].get<std::string>() +
			       "\n\nValue: " + heading(estimate["value"].dump()) + "\n\n";
		}
	return out;
}
} // namespace roadmap::formats
