#include "json-project.hpp"
#include "embedded-resources.hpp"
#include "strict-json.hpp"
#include <algorithm>
#include <chrono>
#include <nlohmann/json.hpp>
#include <regex>
#include <roadmap/application/project-validation.hpp>
#include <set>

// All JSON-library types remain in this adapter. The domain owns ordinary C++ values.
namespace nlohmann {
template <class T> struct adl_serializer<std::optional<T>> {
	static void to_json(json &j, const std::optional<T> &value) {
		j = value ? json(*value) : json(nullptr);
	}
	static void from_json(const json &j, std::optional<T> &value) {
		if (j.is_null())
			value.reset();
		else
			value = j.get<T>();
	}
};
} // namespace nlohmann
namespace roadmap {
using nlohmann::json;
NLOHMANN_JSON_SERIALIZE_ENUM(IntentStatus, {{IntentStatus::draft, "draft"},
                                            {IntentStatus::active, "active"},
                                            {IntentStatus::implemented, "implemented"},
                                            {IntentStatus::deferred, "deferred"}})
NLOHMANN_JSON_SERIALIZE_ENUM(IntentKind, {{IntentKind::finite, "finite"},
                                          {IntentKind::continuous, "continuous"}})
NLOHMANN_JSON_SERIALIZE_ENUM(StepStereotype, {{StepStereotype::intent, "intent"},
                                              {StepStereotype::module, "module"},
                                              {StepStereotype::shared, "shared"},
                                              {StepStereotype::validation, "validation"},
                                              {StepStereotype::exportStep, "export"}})
NLOHMANN_JSON_SERIALIZE_ENUM(ModuleKind, {{ModuleKind::core, "core"},
                                          {ModuleKind::ui, "ui"},
                                          {ModuleKind::storage, "storage"},
                                          {ModuleKind::exportModule, "export"},
                                          {ModuleKind::demo, "demo"},
                                          {ModuleKind::validation, "validation"}})
NLOHMANN_JSON_SERIALIZE_ENUM(ModuleExistence, {{ModuleExistence::planned, "planned"},
                                               {ModuleExistence::existing, "existing"},
                                               {ModuleExistence::deprecated, "deprecated"}})
NLOHMANN_JSON_SERIALIZE_ENUM(EstimateMetric, {{EstimateMetric::effort, "effort"},
                                              {EstimateMetric::elapsed, "elapsed"}})
NLOHMANN_JSON_SERIALIZE_ENUM(EstimateConfidence, {{EstimateConfidence::low, "low"},
                                                  {EstimateConfidence::medium, "medium"},
                                                  {EstimateConfidence::high, "high"}})
NLOHMANN_JSON_SERIALIZE_ENUM(TerminologyProfile, {{TerminologyProfile::engineering, "engineering"},
                                                  {TerminologyProfile::simple, "simple"},
                                                  {TerminologyProfile::product, "product"},
                                                  {TerminologyProfile::literary, "literary"}})
void to_json(json &j, const EstimateValue &value) {
	std::visit(
	    [&](const auto &v) {
		    using T = std::decay_t<decltype(v)>;
		    if constexpr (std::is_same_v<T, EstimateRange>)
			    j = {{"type", "range"},
			         {"metric", v.metric},
			         {"minMinutes", v.minMinutes},
			         {"maxMinutes", v.maxMinutes}};
		    else if constexpr (std::is_same_v<T, EstimateText>)
			    j = {{"type", "text"}, {"text", v.text}};
		    else
			    j = {{"type", std::is_same_v<T, EstimateUnknown> ? "unknown" : "not-applicable"},
			         {"reason", v.reason}};
	    },
	    value);
}
void from_json(const json &j, EstimateValue &value) {
	const auto type = j.at("type").get<std::string>();
	if (type == "range")
		value =
		    EstimateRange{j.at("metric").get<EstimateMetric>(), j.at("minMinutes").get<std::int64_t>(),
		                  j.at("maxMinutes").get<std::int64_t>()};
	else if (type == "text")
		value = EstimateText{j.at("text").get<std::string>()};
	else if (type == "unknown")
		value = EstimateUnknown{j.at("reason").get<std::string>()};
	else
		value = EstimateNotApplicable{j.at("reason").get<std::string>()};
}
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RouteStep, id, title, stereotype, estimateId, linkedModuleIds,
                                   linkedChunkIds)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(IntentRoute, id, intentId, title, steps)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(IntentNode, id, title, summary, status, kind, parentIntentIds,
                                   acceptanceCriteria)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(CodeRef, repository, path, revision, symbol)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RoadmapModule, id, title, summary, kind, linkedIntentIds,
                                   existence, codeRefs)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(LiterateChunk, id, name, body, linkedIntentIds, linkedModuleIds)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RoadmapIntersection, id, title, sourceIds, note)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(EstimateEntry, id, label, confidence, basis, value)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RoadmapMetadata, formatVersion, createdAt, updatedAt)
NLOHMANN_DEFINE_TYPE_NON_INTRUSIVE(RoadmapProject, schemaVersion, id, title, terminologyProfile,
                                   intents, selectedIntentId, selectedRouteId, routes, modules,
                                   chunks, intersections, estimates, metadata)
} // namespace roadmap
namespace roadmap::formats {
namespace {
using nlohmann::json;
struct ParseFailure {
	std::string code, message;
};
std::string pointerToken(std::string value) {
	std::string out;
	for (char c : value) {
		if (c == '~')
			out += "~0";
		else if (c == '/')
			out += "~1";
		else
			out += c;
	}
	return out;
}
bool matchesType(const json &j, const std::string &type) {
	if (type == "object")
		return j.is_object();
	if (type == "array")
		return j.is_array();
	if (type == "string")
		return j.is_string();
	if (type == "integer")
		return j.is_number_integer();
	if (type == "null")
		return j.is_null();
	if (type == "boolean")
		return j.is_boolean();
	return false;
}
bool isTimestamp(std::string_view value) {
	if (value.size() < 20 || value[4] != '-' || value[7] != '-' || value[10] != 'T' ||
	    value[13] != ':' || value[16] != ':' || value.back() != 'Z')
		return false;
	for (std::size_t i = 0; i < 19; ++i)
		if (i != 4 && i != 7 && i != 10 && i != 13 && i != 16 && (value[i] < '0' || value[i] > '9'))
			return false;
	auto number = [&](std::size_t start, std::size_t count) {
		unsigned n = 0;
		for (std::size_t i = 0; i < count; ++i)
			n = n * 10 + static_cast<unsigned>(value[start + i] - '0');
		return n;
	};
	const std::chrono::year_month_day date{std::chrono::year(static_cast<int>(number(0, 4))),
	                                       std::chrono::month(number(5, 2)),
	                                       std::chrono::day(number(8, 2))};
	if (!date.ok() || number(11, 2) > 23 || number(14, 2) > 59 || number(17, 2) > 60)
		return false;
	if (value.size() == 20)
		return true;
	if (value[19] != '.' || value.size() == 21)
		return false;
	for (std::size_t i = 20; i + 1 < value.size(); ++i)
		if (value[i] < '0' || value[i] > '9')
			return false;
	return true;
}
void shape(const json &value, const json &schema, const json &root, const std::string &path,
           DiagnosticReport &report) {
	auto fail = [&](std::string code, std::string message) {
		report.add({std::move(code), "error", {}, path, {}, std::move(message), {}, "json"});
	};
	if (schema.contains("$ref")) {
		shape(value, root.at(json::json_pointer(schema["$ref"].get<std::string>().substr(1))), root,
		      path, report);
		return;
	}
	if (schema.contains("oneOf")) {
		if (!value.is_object() || !value.contains("type")) {
			fail("E_FIELD_TYPE", "Expected tagged estimate object");
			return;
		}
		for (const auto &option : schema["oneOf"])
			if (option["properties"]["type"]["const"] == value["type"]) {
				shape(value, option, root, path, report);
				return;
			}
		fail("E_FIELD_TYPE", "Unknown estimate variant");
		return;
	}
	if (schema.contains("anyOf")) {
		if (value.is_null())
			return;
		shape(value, schema["anyOf"][0], root, path, report);
		return;
	}
	if (schema.contains("type")) {
		bool valid = false;
		if (schema["type"].is_array()) {
			for (const auto &type : schema["type"])
				valid = valid || matchesType(value, type.get<std::string>());
		} else
			valid = matchesType(value, schema["type"].get<std::string>());
		if (!valid) {
			fail(path.ends_with("Minutes") ? "E_ESTIMATE_RANGE" : "E_FIELD_TYPE",
			     "Unexpected value type; expected " + schema["type"].dump());
			return;
		}
	}
	if (schema.contains("const") && value != schema["const"])
		fail(path == "/schemaVersion" ? "E_SCHEMA_VERSION" : "E_FIELD_TYPE",
		     "Expected " + schema["const"].dump());
	if (schema.contains("enum") &&
	    std::find(schema["enum"].begin(), schema["enum"].end(), value) == schema["enum"].end())
		fail("E_FIELD_TYPE", "Expected one of " + schema["enum"].dump());
	if (value.is_object()) {
		for (const auto &key : schema.value("required", json::array()))
			if (!value.contains(key.get<std::string>()))
				report.add({"E_FIELD_TYPE",
				            "error",
				            {},
				            path + "/" + key.get<std::string>(),
				            {},
				            "Required field is missing",
				            {},
				            "json"});
		for (auto it = value.begin(); it != value.end(); ++it) {
			if (!schema["properties"].contains(it.key()))
				report.add({"E_FIELD_UNKNOWN",
				            "error",
				            {},
				            path + "/" + pointerToken(it.key()),
				            {},
				            "Unknown field; allowed: " + schema["required"].dump(),
				            {},
				            "json"});
			else
				shape(it.value(), schema["properties"][it.key()], root, path + "/" + pointerToken(it.key()),
				      report);
		}
	}
	if (value.is_array()) {
		if (schema.contains("maxItems") && value.size() > schema["maxItems"].get<std::size_t>())
			fail("E_INPUT_LIMIT", "Array exceeds limit " + schema["maxItems"].dump());
		if (schema.contains("minItems") && value.size() < schema["minItems"].get<std::size_t>())
			fail("E_FIELD_TYPE", "Too few items");
		for (std::size_t i = 0; i < value.size(); ++i)
			shape(value[i], schema["items"], root, path + "/" + std::to_string(i), report);
	}
	if (value.is_string()) {
		const auto &str = value.get_ref<const std::string &>();
		const bool id = schema.contains("pattern");
		if (schema.contains("maxLength") && str.size() > schema["maxLength"].get<std::size_t>()) {
			fail(id ? "E_ID_INVALID" : "E_INPUT_LIMIT",
			     "UTF-8 string exceeds byte limit " + schema["maxLength"].dump());
			return;
		}
		if (schema.contains("minLength") && str.empty())
			fail(path.ends_with("/reason") ? "E_ESTIMATE_REASON" : "E_FIELD_TYPE",
			     "Nonempty text is required");
		static const std::regex idPattern("[a-z][a-z0-9]*(?:-[a-z0-9]+)*");
		if (id && !std::regex_match(str, idPattern))
			fail("E_ID_INVALID", "ID must match [a-z][a-z0-9]*(?:-[a-z0-9]+)*, 1..64 ASCII bytes");
		if (schema.contains("format") && !isTimestamp(str))
			fail("E_FIELD_TYPE", "Expected a valid RFC 3339 UTC calendar timestamp with Z");
	}
	if (value.is_number() && schema.contains("minimum") &&
	    (value < schema["minimum"] || (schema.contains("maximum") && value > schema["maximum"])))
		fail("E_ESTIMATE_RANGE", "Minutes must be integer in 0..1000000000");
}
} // namespace
DiagnosticReport checkJsonShape(const json &value, const json &schema) {
	DiagnosticReport report;
	shape(value, schema, schema, "", report);
	return report;
}
bool isValidUtf8(std::string_view text) {
	for (std::size_t i = 0; i < text.size();) {
		const auto first = static_cast<unsigned char>(text[i++]);
		if (first < 0x80)
			continue;
		const int count = first >= 0xc2 && first <= 0xdf   ? 1
		                  : first >= 0xe0 && first <= 0xef ? 2
		                  : first >= 0xf0 && first <= 0xf4 ? 3
		                                                   : -1;
		if (count < 0 || i + count > text.size())
			return false;
		const auto next = static_cast<unsigned char>(text[i]);
		if ((first == 0xe0 && next < 0xa0) || (first == 0xed && next >= 0xa0) ||
		    (first == 0xf0 && next < 0x90) || (first == 0xf4 && next >= 0x90))
			return false;
		for (int j = 0; j < count; ++j) {
			const auto byte = static_cast<unsigned char>(text[i++]);
			if (byte < 0x80 || byte > 0xbf)
				return false;
		}
	}
	return true;
}
// This parser detects duplicate keys before a DOM can replace the first value.
JsonReadResult readStrictJson(std::string_view text, std::size_t maxBytes) {
	JsonReadResult out;
	if (text.size() > maxBytes) {
		out.add({"E_INPUT_LIMIT",
		         "error",
		         {},
		         "",
		         {},
		         "Input bytes: " + std::to_string(text.size()) + "; limit: " + std::to_string(maxBytes),
		         {},
		         "json"});
		return out;
	}
	if (!isValidUtf8(text)) {
		out.add({"E_INPUT_ENCODING", "error", {}, "", {}, "Input must be valid UTF-8", {}, "json"});
		return out;
	}
	const std::size_t bom = text.starts_with("\xEF\xBB\xBF") ? 3 : 0;
	if (bom)
		text.remove_prefix(bom);
	try {
		std::vector<std::set<std::string>> keys;
		const auto callback = [&](int depth, json::parse_event_t event, json &parsed) {
			if (depth >= 64 &&
			    (event == json::parse_event_t::object_start || event == json::parse_event_t::array_start))
				throw ParseFailure{"E_INPUT_LIMIT",
				                   "JSON containers: " + std::to_string(depth + 1) + "; limit: 64"};
			if (event == json::parse_event_t::object_start)
				keys.emplace_back();
			if (event == json::parse_event_t::key &&
			    !keys.back().insert(parsed.get<std::string>()).second)
				throw ParseFailure{"E_DUPLICATE_KEY", "Duplicate key: " + parsed.get<std::string>()};
			if (event == json::parse_event_t::object_end)
				keys.pop_back();
			return true;
		};
		const auto value = json::parse(text, callback);
		out.value = value;
	} catch (const ParseFailure &error) {
		out.add({error.code, "error", {}, "", {}, error.message, {}, "json"});
	} catch (const json::parse_error &error) {
		const auto code = std::string(error.what()).find("UTF-8") != std::string::npos
		                      ? "E_INPUT_ENCODING"
		                      : "E_PARSE_JSON";
		Diagnostic d{code, "error", {}, "", {}, error.what(), {}, "json"};
		const auto offset = error.byte > 0 ? error.byte - 1 : 0;
		if (offset <= text.size()) {
			d.source.byteOffset = offset + bom;
			d.source.line = 1;
			d.source.columnBytes = 1 + bom;
			for (std::size_t i = 0; i < offset; ++i) {
				if (text[i] == '\n') {
					++*d.source.line;
					d.source.columnBytes = 1;
				} else
					++*d.source.columnBytes;
			}
		}
		out.add(std::move(d));
	} catch (const json::exception &error) {
		out.add({"E_FIELD_TYPE", "error", {}, "", {}, error.what(), {}, "json"});
	}
	return out;
}
ProjectReadResult readJsonProject(std::string_view text) {
	ProjectReadResult out;
	auto parsed = readStrictJson(text);
	static_cast<DiagnosticReport &>(out) = parsed;
	if (!parsed.value)
		return out;
	const auto schema = json::parse(resources::schema);
	shape(*parsed.value, schema, schema, "", out);
	if (!out.hasErrors()) {
		auto candidate = parsed.value->get<RoadmapProject>();
		const auto validation = validateProject(candidate);
		for (const auto &diagnostic : validation.diagnostics)
			out.add(diagnostic);
		out.diagnosticsTruncated |= validation.diagnosticsTruncated;
		out.containsError |= validation.hasErrors();
		if (!out.hasErrors())
			out.project = std::move(candidate);
	}
	return out;
}
std::string writeJsonProject(const RoadmapProject &project) {
	return json(project).dump(2) + '\n';
}
std::string projectSchema() {
	return std::string(resources::schema);
}
std::string projectTemplate() {
	return std::string(resources::example);
}
} // namespace roadmap::formats
