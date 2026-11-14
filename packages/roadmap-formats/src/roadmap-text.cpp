#include "roadmap-text.hpp"
#include "strict-json.hpp"
#include <cctype>
#include <map>
#include <regex>
#include <roadmap/application/project-validation.hpp>
#include <set>
namespace roadmap::formats {
namespace {
using nlohmann::json;
void skip(std::string_view text, std::size_t &pos) {
	while (pos < text.size()) {
		if (std::isspace(static_cast<unsigned char>(text[pos]))) {
			++pos;
			continue;
		}
		if (text[pos] == '#') {
			while (pos < text.size() && text[pos] != '\n')
				++pos;
			continue;
		}
		break;
	}
}
} // namespace
ProjectReadResult readTextProject(std::string_view text) {
	ProjectReadResult out;
	if (text.size() > 8388608) {
		out.add(
		    {"E_INPUT_LIMIT", "error", {}, "", {}, "Input exceeds 8388608 bytes", {}, "roadmap-text"});
		return out;
	}
	if (!isValidUtf8(text)) {
		out.add({"E_INPUT_ENCODING", "error", {}, "", {}, "Expected UTF-8", {}, "roadmap-text"});
		return out;
	}
	if (text.starts_with("\xEF\xBB\xBF"))
		text.remove_prefix(3);
	std::size_t pos = 0;
	skip(text, pos);
	auto fail = [&](std::string code, std::string message, std::optional<std::string> id = {}) {
		Diagnostic d{std::move(code), "error", id, "", {}, std::move(message), {}, "roadmap-text"};
		d.source.byteOffset = pos;
		d.source.line = 1;
		d.source.columnBytes = 1;
		for (std::size_t i = 0; i < pos && i < text.size(); ++i) {
			if (text[i] == '\n') {
				++*d.source.line;
				d.source.columnBytes = 1;
			} else
				++*d.source.columnBytes;
		}
		out.add(std::move(d));
	};
	if (text.substr(pos, 15) != "!roadmap-text 1" ||
	    (pos + 15 < text.size() && !std::isspace(static_cast<unsigned char>(text[pos + 15])))) {
		// The version header is 15 bytes including the leading exclamation mark.
		const auto end = text.find('\n', pos);
		if (text.substr(pos, end == text.npos ? text.size() - pos : end - pos) != "!roadmap-text 1") {
			fail("E_PARSE_TEXT", "Expected !roadmap-text 1 header");
			return out;
		}
	}
	pos = text.find('\n', pos);
	if (pos == text.npos) {
		fail("E_PARSE_TEXT", "Project record is missing");
		return out;
	}
	++pos;
	std::map<std::string, std::vector<json>> records;
	std::map<std::string, std::vector<std::string>> blocks;
	std::set<std::string> declared;
	const std::map<std::string, std::string> plurals{{"intent", "intents"},
	                                                 {"route", "routes"},
	                                                 {"module", "modules"},
	                                                 {"chunk", "chunks"},
	                                                 {"intersection", "intersections"},
	                                                 {"estimate", "estimates"}};
	while (true) {
		skip(text, pos);
		if (pos == text.size())
			break;
		if (text.substr(pos, 8) == "<<route:") {
			const auto end = text.find(">>", pos);
			if (end == text.npos) {
				fail("E_PARSE_TEXT", "Unclosed route header");
				return out;
			}
			const std::string id(text.substr(pos + 8, end - pos - 8));
			pos = end + 2;
			const auto close = text.find("<<end-route>>", pos);
			if (close == text.npos) {
				fail("E_PARSE_TEXT", "Expected <<end-route>>");
				return out;
			}
			if (blocks.contains(id)) {
				fail("E_ROUTE_MEMBERSHIP", "Duplicate route block", id);
				return out;
			}
			std::vector<std::string> steps;
			bool needStep = true;
			while (pos < close) {
				while (pos < close && std::isspace(static_cast<unsigned char>(text[pos])))
					++pos;
				if (pos == close)
					break;
				if (needStep) {
					if (text[pos] != '[') {
						fail("E_PARSE_TEXT", "Expected [step-id]");
						return out;
					}
					const auto stop = text.find(']', pos);
					if (stop == text.npos || stop >= close) {
						fail("E_PARSE_TEXT", "Unclosed step reference");
						return out;
					}
					steps.emplace_back(text.substr(pos + 1, stop - pos - 1));
					pos = stop + 1;
					needStep = false;
				} else if (text.substr(pos, 2) == "->") {
					pos += 2;
					needStep = true;
				} else if (text.substr(pos, 3) == "→") {
					pos += 3;
					needStep = true;
				} else {
					fail("E_PARSE_TEXT", "Expected -> or → between steps");
					return out;
				}
			}
			if (needStep && !steps.empty()) {
				fail("E_PARSE_TEXT", "Trailing route arrow");
				return out;
			}
			blocks[id] = std::move(steps);
			pos = close + 13;
			continue;
		}
		const auto begin = pos;
		while (pos < text.size() && text[pos] >= 'a' && text[pos] <= 'z')
			++pos;
		const std::string kind(text.substr(begin, pos - begin));
		if (kind != "project" && kind != "step" && !plurals.contains(kind)) {
			fail("E_PARSE_TEXT", "Unknown record keyword: " + kind);
			return out;
		}
		while (pos < text.size() && std::isspace(static_cast<unsigned char>(text[pos])))
			++pos;
		const auto idStart = pos;
		while (pos < text.size() &&
		       (std::isalnum(static_cast<unsigned char>(text[pos])) || text[pos] == '-'))
			++pos;
		const std::string id(text.substr(idStart, pos - idStart));
		if (id.size() > 64 || !std::regex_match(id, std::regex("[a-z][a-z0-9]*(?:-[a-z0-9]+)*"))) {
			fail("E_ID_INVALID", "Invalid record ID", id);
			return out;
		}
		if (!declared.insert(id).second) {
			fail("E_ID_DUPLICATE", "Record ID already declared", id);
			return out;
		}
		while (pos < text.size() && std::isspace(static_cast<unsigned char>(text[pos])))
			++pos;
		if (pos == text.size() || text[pos] != '{') {
			fail("E_PARSE_TEXT", "Expected JSON object after record ID", id);
			return out;
		}
		const auto objectStart = pos;
		int depth = 0;
		bool quoted = false, escaped = false;
		do {
			const char c = text[pos++];
			if (quoted) {
				if (escaped)
					escaped = false;
				else if (c == '\\')
					escaped = true;
				else if (c == '"')
					quoted = false;
			} else if (c == '"')
				quoted = true;
			else if (c == '{' || c == '[')
				++depth;
			else if (c == '}' || c == ']')
				--depth;
			if (depth > 64) {
				fail("E_INPUT_LIMIT", "JSON depth exceeds 64");
				return out;
			}
		} while (pos < text.size() && (depth > 0 || quoted));
		if (depth != 0 || quoted) {
			fail("E_PARSE_TEXT", "Unclosed JSON object", id);
			return out;
		}
		auto parsed = readStrictJson(text.substr(objectStart, pos - objectStart));
		if (!parsed.value) {
			out.diagnostics = std::move(parsed.diagnostics);
			out.containsError = true;
			return out;
		}
		auto value = *parsed.value;
		if (value.contains("id") || (kind == "route" && value.contains("steps"))) {
			fail("E_FIELD_UNKNOWN", "Record embeds a field owned by RoadmapText grammar", id);
			return out;
		}
		if (kind == "project")
			for (const auto &[_, plural] : plurals)
				if (value.contains(plural)) {
					fail("E_FIELD_UNKNOWN", "Project collections must be separate records", id);
					return out;
				}
		value["id"] = id;
		records[kind].push_back(std::move(value));
	}
	if (records["project"].size() != 1) {
		fail("E_PARSE_TEXT", "Exactly one project record is required");
		return out;
	}
	auto project = records["project"][0];
	std::map<std::string, json> stepById;
	std::map<std::string, int> membership;
	for (const auto &step : records["step"])
		stepById[step["id"].get<std::string>()] = step;
	std::set<std::string> routeIds;
	for (auto &route : records["route"]) {
		const auto id = route["id"].get<std::string>();
		routeIds.insert(id);
		route["steps"] = json::array();
		if (!blocks.contains(id)) {
			fail("E_ROUTE_MEMBERSHIP", "Route must have exactly one block", id);
			continue;
		}
		for (const auto &sid : blocks[id]) {
			if (!stepById.contains(sid)) {
				fail("E_REF_NOT_FOUND", "Undeclared step " + sid, id);
				continue;
			}
			++membership[sid];
			route["steps"].push_back(stepById[sid]);
		}
	}
	for (const auto &[id, _] : blocks)
		if (!routeIds.contains(id))
			fail("E_REF_NOT_FOUND", "Block names an undeclared route", id);
	for (const auto &[id, _] : stepById)
		if (membership[id] != 1)
			fail("E_ROUTE_MEMBERSHIP", "Step must occur in exactly one route block", id);
	if (out.hasErrors())
		return out;
	for (const auto &[kind, plural] : plurals)
		project[plural] = records[kind];
	return readJsonProject(project.dump());
}
ProjectReadResult readProject(std::string_view text, std::string_view format) {
	if (format == "json")
		return readJsonProject(text);
	if (format == "roadmap-text")
		return readTextProject(text);
	auto probe = text;
	if (probe.starts_with("\xEF\xBB\xBF"))
		probe.remove_prefix(3);
	std::size_t p = 0;
	skip(probe, p);
	if (p < probe.size() && probe[p] == '{')
		return readJsonProject(text);
	return readTextProject(text);
}
std::string writeTextProject(const RoadmapProject &project) {
	auto value = json::parse(writeJsonProject(project));
	auto record = [](const std::string &kind, json entry) {
		const auto id = entry["id"].get<std::string>();
		entry.erase("id");
		return kind + " " + id + " " + entry.dump(2) + "\n";
	};
	auto head = value;
	for (const auto *key : {"intents", "routes", "modules", "chunks", "intersections", "estimates"})
		head.erase(key);
	std::string out = "!roadmap-text 1\n" + record("project", head);
	for (const auto &[kind, plural] :
	     std::vector<std::pair<std::string, std::string>>{{"intent", "intents"},
	                                                      {"module", "modules"},
	                                                      {"chunk", "chunks"},
	                                                      {"intersection", "intersections"},
	                                                      {"estimate", "estimates"}})
		for (const auto &entry : value[plural])
			out += '\n' + record(kind, entry);
	for (auto route : value["routes"]) {
		const auto steps = route["steps"];
		route.erase("steps");
		out += '\n' + record("route", route);
		for (const auto &step : steps)
			out += '\n' + record("step", step);
		out += "\n<<route:" + route["id"].get<std::string>() + ">>\n";
		bool first = true;
		for (const auto &step : steps) {
			if (!first)
				out += " -> ";
			first = false;
			out += "[" + step["id"].get<std::string>() + "]";
		}
		out += "\n<<end-route>>\n";
	}
	return out;
}
} // namespace roadmap::formats
