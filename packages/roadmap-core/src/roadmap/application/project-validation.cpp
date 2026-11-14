#include "project-validation.hpp"
#include <algorithm>
#include <map>
#include <set>
#include <tuple>

namespace roadmap {
DiagnosticReport validateProject(const RoadmapProject &project) {
	DiagnosticReport out;
	std::size_t entityCount = 1 + project.intents.size() + project.routes.size() +
	                          project.modules.size() + project.chunks.size() +
	                          project.intersections.size() + project.estimates.size();
	std::size_t referenceCount =
	    (project.selectedIntentId ? 1 : 0) + (project.selectedRouteId ? 1 : 0);
	for (const auto &n : project.intents)
		referenceCount += n.parentIntentIds.size();
	for (const auto &n : project.modules)
		referenceCount += n.linkedIntentIds.size();
	for (const auto &n : project.chunks)
		referenceCount += n.linkedIntentIds.size() + n.linkedModuleIds.size();
	for (const auto &n : project.intersections)
		referenceCount += n.sourceIds.size();
	for (const auto &r : project.routes) {
		entityCount += r.steps.size();
		++referenceCount;
		for (const auto &n : r.steps)
			referenceCount += n.linkedModuleIds.size() + n.linkedChunkIds.size() + (n.estimateId ? 1 : 0);
		if (r.steps.size() > 2000) {
			out.add({"E_INPUT_LIMIT",
			         "error",
			         r.id,
			         "",
			         {},
			         "Route steps: " + std::to_string(r.steps.size()) + "; limit: 2000",
			         {},
			         "routes"});
			return out;
		}
	}
	if (entityCount > 10000 || referenceCount > 100000) {
		out.add({"E_INPUT_LIMIT",
		         "error",
		         project.id,
		         "",
		         {},
		         "Entities: " + std::to_string(entityCount) +
		             " / 10000; references: " + std::to_string(referenceCount) + " / 100000",
		         {},
		         "json"});
		return out;
	}

	struct Indexed {
		std::string type, pointer;
	};
	std::map<std::string, Indexed> index;
	std::map<std::string, std::size_t> uses;
	std::size_t count = 0, links = 0;
	auto add = [&](std::string code, std::string owner, std::string pointer, std::string message,
	               std::vector<std::string> related = {}, std::string severity = "error") {
		out.add({std::move(code),
		         std::move(severity),
		         std::move(owner),
		         std::move(pointer),
		         {},
		         std::move(message),
		         std::move(related),
		         "references"});
	};
	auto entity = [&](const std::string &id, std::string type, std::string path) {
		++count;
		const auto alnum = [](char c) { return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'); };
		const bool valid =
		    !id.empty() && id.size() <= 64 && id.front() >= 'a' && id.front() <= 'z' &&
		    id.back() != '-' && id.find("--") == id.npos &&
		    std::all_of(id.begin(), id.end(), [&](char c) { return alnum(c) || c == '-'; });
		if (!valid)
			add("E_ID_INVALID", id, path + "/id", "Invalid stable ASCII ID", {id});

		if (!index.emplace(id, Indexed{std::move(type), path}).second)
			add("E_ID_DUPLICATE", id, path + "/id", "ID already declared at " + index.at(id).pointer,
			    {id});
	};
	entity(project.id, "project", "");
	auto collect = [&](const auto &values, const std::string &type, const std::string &path) {
		for (std::size_t i = 0; i < values.size(); ++i)
			entity(values[i].id, type, path + "/" + std::to_string(i));
	};
	collect(project.intents, "intent", "/intents");
	collect(project.routes, "route", "/routes");
	collect(project.modules, "module", "/modules");
	collect(project.chunks, "chunk", "/chunks");
	collect(project.intersections, "intersection", "/intersections");
	collect(project.estimates, "estimate", "/estimates");
	for (std::size_t r = 0; r < project.routes.size(); ++r)
		collect(project.routes[r].steps, "step", "/routes/" + std::to_string(r) + "/steps");
	if (count > 10000)
		add("E_INPUT_LIMIT", project.id, "",
		    "Entity count " + std::to_string(count) + " exceeds 10000");
	std::size_t totalLinks = 0;
	for (const auto &n : project.intents)
		totalLinks += n.parentIntentIds.size();
	for (const auto &n : project.modules)
		totalLinks += n.linkedIntentIds.size();
	for (const auto &n : project.chunks)
		totalLinks += n.linkedIntentIds.size() + n.linkedModuleIds.size();
	for (const auto &n : project.intersections)
		totalLinks += n.sourceIds.size();
	for (const auto &r : project.routes) {
		totalLinks += 1;
		for (const auto &n : r.steps)
			totalLinks += n.linkedModuleIds.size() + n.linkedChunkIds.size() + (n.estimateId ? 1 : 0);
	}
	totalLinks += (project.selectedIntentId ? 1 : 0) + (project.selectedRouteId ? 1 : 0);
	if (totalLinks > 100000)
		add("E_INPUT_LIMIT", project.id, "",
		    "Reference count " + std::to_string(totalLinks) + " exceeds 100000");
	if (count > 10000 || totalLinks > 100000)
		return out;

	auto ref = [&](const std::string &id, const std::string &type, const std::string &owner,
	               const std::string &path) {
		++links;
		const auto found = index.find(id);
		if (found == index.end())
			add("E_REF_NOT_FOUND", owner, path, "Referenced ID does not exist: " + id, {id});
		else if (type == "source" ? (found->second.type != "intent" && found->second.type != "module" &&
		                             found->second.type != "chunk" && found->second.type != "step")
		                          : found->second.type != type)
			add("E_REF_TYPE", owner, path, "Expected " + type + ", found " + found->second.type, {id});
		else
			++uses[id];
	};
	auto refs = [&](const auto &ids, const std::string &type, const std::string &owner,
	                const std::string &path) {
		std::set<std::string> seen;
		for (std::size_t i = 0; i < ids.size(); ++i) {
			const auto p = path + "/" + std::to_string(i);
			if (!seen.insert(ids[i]).second)
				add("E_REF_DUPLICATE", owner, p, "Repeated reference", {ids[i]});
			ref(ids[i], type, owner, p);
		}
	};
	std::map<std::string, std::vector<std::string>> parents;
	for (std::size_t i = 0; i < project.intents.size(); ++i) {
		const auto &n = project.intents[i];
		const auto p = "/intents/" + std::to_string(i);
		refs(n.parentIntentIds, "intent", n.id, p + "/parentIntentIds");
		parents[n.id] = n.parentIntentIds;
		if (n.kind == IntentKind::continuous && n.status == IntentStatus::implemented)
			add("E_INTENT_CONTINUOUS_STATUS", n.id, p + "/status",
			    "Continuous intention is active or deferred, never implemented");
		if ((n.status == IntentStatus::active || n.status == IntentStatus::implemented) &&
		    n.acceptanceCriteria.empty())
			add("W_ACCEPTANCE_MISSING", n.id, p + "/acceptanceCriteria",
			    "Define an observable acceptance criterion", {}, "warning");
	}
	// Iterative DFS prevents a long valid lineage from overflowing the C++ stack.
	std::map<std::string, int> colors;
	for (const auto &intent : project.intents) {
		if (colors[intent.id])
			continue;
		std::vector<std::pair<std::string, std::size_t>> stack{{intent.id, 0}};
		colors[intent.id] = 1;
		while (!stack.empty()) {
			auto &[id, next] = stack.back();
			if (next == parents[id].size()) {
				colors[id] = 2;
				stack.pop_back();
				continue;
			}
			const auto parent = parents[id][next++];
			if (!parents.contains(parent))
				continue;
			if (colors[parent] == 1) {
				std::vector<std::string> cycle;
				auto first = std::find_if(stack.begin(), stack.end(),
				                          [&](const auto &v) { return v.first == parent; });
				for (auto it = first; it != stack.end(); ++it)
					cycle.push_back(it->first);
				cycle.push_back(parent);
				add("E_INTENT_CYCLE", id, index.at(id).pointer + "/parentIntentIds",
				    "Cyclic intention lineage", cycle);
			} else if (!colors[parent]) {
				colors[parent] = 1;
				stack.emplace_back(parent, 0);
			}
		}
	}
	for (std::size_t r = 0; r < project.routes.size(); ++r) {
		const auto &route = project.routes[r];
		const auto p = "/routes/" + std::to_string(r);
		ref(route.intentId, "intent", route.id, p + "/intentId");
		if (route.steps.empty())
			add("W_ROUTE_EMPTY", route.id, p + "/steps", "Draft route has no steps", {}, "warning");
		if (route.steps.size() > 2000)
			add("E_INPUT_LIMIT", route.id, p + "/steps", "Route exceeds 2000 steps");
		for (std::size_t s = 0; s < route.steps.size(); ++s) {
			const auto &step = route.steps[s];
			const auto sp = p + "/steps/" + std::to_string(s);
			if (step.estimateId)
				ref(*step.estimateId, "estimate", step.id, sp + "/estimateId");
			refs(step.linkedModuleIds, "module", step.id, sp + "/linkedModuleIds");
			refs(step.linkedChunkIds, "chunk", step.id, sp + "/linkedChunkIds");
		}
	}
	for (std::size_t i = 0; i < project.modules.size(); ++i) {
		const auto &n = project.modules[i];
		const auto p = "/modules/" + std::to_string(i);
		refs(n.linkedIntentIds, "intent", n.id, p + "/linkedIntentIds");
		for (std::size_t c = 0; c < n.codeRefs.size(); ++c) {
			const auto &path = n.codeRefs[c].path;
			if (path.empty() || path[0] == '/' || path.find('\\') != std::string::npos ||
			    path.find(':') != std::string::npos || path == ".." || path.starts_with("../") ||
			    path.ends_with("/..") || path.find("/../") != std::string::npos)
				add("E_FIELD_TYPE", n.id, p + "/codeRefs/" + std::to_string(c) + "/path",
				    "Expected relative code path with / separators");
		}
	}
	for (std::size_t i = 0; i < project.chunks.size(); ++i) {
		const auto &n = project.chunks[i];
		const auto p = "/chunks/" + std::to_string(i);
		refs(n.linkedIntentIds, "intent", n.id, p + "/linkedIntentIds");
		refs(n.linkedModuleIds, "module", n.id, p + "/linkedModuleIds");
	}
	for (std::size_t i = 0; i < project.intersections.size(); ++i) {
		const auto &n = project.intersections[i];
		refs(n.sourceIds, "source", n.id, "/intersections/" + std::to_string(i) + "/sourceIds");
	}
	for (std::size_t i = 0; i < project.estimates.size(); ++i) {
		const auto &n = project.estimates[i];
		const auto p = "/estimates/" + std::to_string(i);
		if (n.basis.empty())
			add("W_ESTIMATE_BASIS_MISSING", n.id, p + "/basis", "Explain estimate basis", {}, "warning");
		if (const auto *range = std::get_if<EstimateRange>(&n.value);
		    range && (range->minMinutes < 0 || range->maxMinutes > 1000000000 ||
		              range->minMinutes > range->maxMinutes))
			add("E_ESTIMATE_RANGE", n.id, p + "/value", "Invalid integer minute range");
		std::visit(
		    [&](const auto &value) {
			    if constexpr (requires { value.reason; })
				    if (value.reason.find_first_not_of(" \t\r\n") == std::string::npos)
					    add("E_ESTIMATE_REASON", n.id, p + "/value/reason", "A nonempty reason is required");
		    },
		    n.value);
	}
	if (project.selectedIntentId)
		ref(*project.selectedIntentId, "intent", project.id, "/selectedIntentId");
	if (project.selectedRouteId) {
		ref(*project.selectedRouteId, "route", project.id, "/selectedRouteId");
		const auto route =
		    std::find_if(project.routes.begin(), project.routes.end(),
		                 [&](const auto &r) { return r.id == *project.selectedRouteId; });
		if (!project.selectedIntentId ||
		    (route != project.routes.end() && route->intentId != *project.selectedIntentId))
			add("E_SELECTION", project.id, "/selectedRouteId",
			    "Selected route must belong to selected intention");
	}
	for (const auto &[id, item] : index)
		if ((item.type == "module" || item.type == "chunk" || item.type == "estimate") && !uses[id])
			add("W_UNREFERENCED_OBJECT", id, item.pointer, "Object has no incoming reference", {},
			    "warning");
	if (links > 100000)
		add("E_INPUT_LIMIT", project.id, "",
		    "Reference count " + std::to_string(links) + " exceeds 100000");
	std::stable_sort(
	    out.diagnostics.begin(), out.diagnostics.end(), [](const auto &a, const auto &b) {
		    return std::tie(a.pointer, a.code, a.entityId) < std::tie(b.pointer, b.code, b.entityId);
	    });
	return out;
}
} // namespace roadmap
