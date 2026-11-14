#include "roadmap-api.hpp"
#include "export-project-markdown.hpp"
#include "guidance.hpp"
#include "json-project.hpp"
#include "migrate-project-v1.hpp"
#include "project-views.hpp"
#include "roadmap-text.hpp"
#include "strict-json.hpp"
#include <algorithm>
#include <set>
namespace roadmap {
namespace {
using nlohmann::json;
json optionalString(const std::optional<std::string> &value) {
	return value ? json(*value) : json(nullptr);
}
json optionalNumber(const std::optional<std::size_t> &value) {
	return value ? json(*value) : json(nullptr);
}
json diagnosticJson(const Diagnostic &d, const std::string &language) {
	std::string message = d.message;
	if (language == "ru") {
		const auto catalog = guidance::catalog();
		if (catalog["codes"].contains(d.code)) {
			message = catalog["codes"][d.code]["ru"].get<std::string>();
			for (const auto &id : d.relatedIds)
				message += " " + id;
		}
	}
	return {{"code", d.code},
	        {"severity", d.severity},
	        {"entityId", optionalString(d.entityId)},
	        {"pointer", d.pointer},
	        {"source",
	         {{"line", optionalNumber(d.source.line)},
	          {"columnBytes", optionalNumber(d.source.columnBytes)},
	          {"byteOffset", optionalNumber(d.source.byteOffset)}}},
	        {"message", message},
	        {"relatedIds", d.relatedIds},
	        {"helpTopic", d.helpTopic}};
}
json envelope(const json &id, bool ok, const json &result, const DiagnosticReport &report,
              const std::string &language) {
	json diagnostics = json::array();
	for (const auto &d : report.diagnostics)
		diagnostics.push_back(diagnosticJson(d, language));
	return {{"apiVersion", 1},
	        {"requestId", id},
	        {"ok", ok},
	        {"result", ok ? result : json(nullptr)},
	        {"diagnostics", diagnostics},
	        {"diagnosticsTruncated", report.diagnosticsTruncated}};
}
bool allowed(const json &object, const std::set<std::string> &keys) {
	for (auto it = object.begin(); it != object.end(); ++it)
		if (!keys.contains(it.key()))
			return false;
	return true;
}
} // namespace
std::string processRoadmapRequest(const std::string &requestJson) {
	json requestId = nullptr;
	std::string language = "en";
	DiagnosticReport report;
	auto fail = [&](const std::string &code, const std::string &message) {
		report.add({code, "error", {}, "", {}, message, {}, "commands"});
		return envelope(requestId, false, nullptr, report, language).dump() + '\n';
	};
	try {
		auto parsed = formats::readStrictJson(requestJson, 33554432);
		if (!parsed.value) {
			static_cast<DiagnosticReport &>(report) = parsed;
			return envelope(nullptr, false, nullptr, report, language).dump() + '\n';
		}
		const auto &request = *parsed.value;
		if (!request.is_object() ||
		    !allowed(request, {"apiVersion", "requestId", "operation", "input", "options"}) ||
		    !request.contains("apiVersion") || !request["apiVersion"].is_number_integer() ||
		    request["apiVersion"] != 1 || !request.contains("operation") ||
		    !request["operation"].is_string())
			return fail("E_COMMAND", "Expected API version 1 and operation");
		if (request.contains("requestId")) {
			if (!request["requestId"].is_null() && !request["requestId"].is_string())
				return fail("E_COMMAND", "requestId must be a string or null");
			requestId = request["requestId"];
		}
		const std::string op = request["operation"];
		const std::set<std::string> inputOps{"validate", "import", "normalize", "render",
		                                     "inspect",  "export", "hints",     "migrate"};
		const std::set<std::string> referenceOps{"help", "explain", "schema", "template",
		                                         "getVersions"};
		if (!inputOps.contains(op) && !referenceOps.contains(op))
			return fail("E_COMMAND", "Unknown operation: " + op);
		auto options = request.value("options", json::object());
		if (!options.is_object())
			return fail("E_COMMAND", "options must be an object");
		std::set<std::string> keys{"language"};
		if (op != "getVersions")
			keys.insert("format");
		if (op == "help" || op == "hints")
			keys.insert("terminologyProfile");
		if (op == "help")
			keys.insert("topic");
		if (op == "explain")
			keys.insert("code");
		if (op == "inspect")
			keys.insert("id");
		if (std::set<std::string>{"validate", "import", "normalize", "export", "render", "migrate"}
		        .contains(op))
			keys.insert("strict");
		if (op == "render" || op == "export")
			keys.insert("routeId");
		if (op == "render")
			for (const auto *k : {"width", "offset", "fullWidth", "glyphs"})
				keys.insert(k);
		if (op == "export")
			keys.insert("dialect");
		if (op == "migrate") {
			keys.insert("from");
			keys.insert("to");
		}
		if (!allowed(options, keys))
			return fail("E_COMMAND", "Option is not applicable to " + op);
		for (auto it = options.begin(); it != options.end(); ++it) {
			const auto &key = it.key();
			if (key == "strict" || key == "fullWidth") {
				if (!it.value().is_boolean())
					return fail("E_COMMAND", key + " must be boolean");
			} else if (key == "width" || key == "offset" || key == "from" || key == "to") {
				if (!it.value().is_number_unsigned() &&
				    (!it.value().is_number_integer() || it.value().get<long long>() < 0))
					return fail("E_COMMAND", key + " must be nonnegative integer");
			} else if (!it.value().is_string())
				return fail("E_COMMAND", key + " must be string");
		}
		language = options.value("language", "en");
		if (language != "en" && language != "ru")
			return fail("E_COMMAND", "Supported languages: en, ru");
		const std::string profile = options.value("terminologyProfile", "engineering");
		if (!std::set<std::string>{"engineering", "simple", "product", "literary"}.contains(profile))
			return fail("E_COMMAND", "Unknown terminology profile");
		const auto defaultFormat =
		    (op == "schema" || op == "template" || op == "import" || op == "migrate") ? "json"
		    : op == "export"                                                          ? "markdown"
		    : op == "normalize"                                                       ? "auto"
		                                                                              : "text";
		const std::string format = options.value("format", defaultFormat);
		std::set<std::string> formats{"text", "json"};
		if (op == "schema" || op == "import" || op == "migrate")
			formats = {"json"};
		if (op == "template")
			formats = {"json", "roadmap-text"};
		if (op == "normalize")
			formats = {"auto", "json", "roadmap-text"};
		if (op == "export")
			formats = {"json", "roadmap-text", "markdown"};
		if (op == "help" || op == "hints" || op == "explain")
			formats.insert("markdown");
		if (op != "getVersions" && !formats.contains(format))
			return fail("E_COMMAND", "Unsupported format for " + op);
		if (options.contains("dialect") &&
		    (format != "markdown" || !std::set<std::string>{"standard", "obsidian"}.contains(
		                                 options["dialect"].get<std::string>())))
			return fail("E_COMMAND", "dialect applies to Markdown export");
		if (op == "inspect" && !options.contains("id"))
			return fail("E_COMMAND", "inspect requires id");
		if (op == "explain" && !options.contains("code"))
			return fail("E_COMMAND", "explain requires code");
		formats::RenderOptions render;
		if (options.contains("routeId"))
			render.routeId = options["routeId"].get<std::string>();
		render.width = options.value("width", std::size_t{120});
		render.offset = options.value("offset", std::size_t{0});
		render.fullWidth = options.value("fullWidth", false);
		const auto glyphs = options.value("glyphs", "ascii");
		render.unicode = glyphs == "unicode";
		if (render.width < 40 || !std::set<std::string>{"ascii", "unicode"}.contains(glyphs) ||
		    (render.fullWidth && (options.contains("width") || options.contains("offset"))))
			return fail("E_COMMAND", "Invalid route viewport");
		if (referenceOps.contains(op) && request.contains("input"))
			return fail("E_COMMAND", "This operation has no input");
		json result;
		if (op == "getVersions")
			result = {{"program", HMAP_APP_VERSION},
			          {"schema", 2},
			          {"RoadmapText", 1},
			          {"api", 1},
			          {"guidance", "1.0.0"}};
		else if (op == "schema")
			result = json::parse(formats::projectSchema());
		else if (op == "template") {
			const auto project = formats::readJsonProject(formats::projectTemplate());
			result = format == "json" ? json::parse(formats::projectTemplate())
			                          : json{{"text", formats::writeTextProject(*project.project)},
			                                 {"contentType", "text/plain"},
			                                 {"format", format}};
		} else if (op == "help")
			result = guidance::help(options.value("topic", "getting-started"), language, profile);
		else if (op == "explain")
			result = guidance::explain(options["code"], language);
		else {
			if (!request.contains("input") || !request["input"].is_object() ||
			    !allowed(request["input"], {"format", "text"}) || !request["input"].contains("text") ||
			    !request["input"]["text"].is_string())
				return fail("E_COMMAND", "Expected input.text string");
			const auto inputFormat = request["input"].value("format", "auto");
			if (!std::set<std::string>{"auto", "json", "roadmap-text"}.contains(inputFormat))
				return fail("E_COMMAND", "Unknown input format");
			if (op == "migrate") {
				if (!options.contains("from") || !options.contains("to") || options["from"] != 1 ||
				    options["to"] != 2)
					return fail("E_COMMAND", "Migration requires from=1 and to=2");
				auto migrated = formats::migrateProjectV1(request["input"]["text"].get<std::string>());
				static_cast<DiagnosticReport &>(report) = migrated;
				const bool ok = migrated.project.has_value() &&
				                !(options.value("strict", false) && report.hasWarnings());
				return envelope(
				           requestId, ok,
				           ok ? json{{"project", json::parse(formats::writeJsonProject(*migrated.project))},
				                     {"migrationReport", migrated.migrationReport}}
				              : json(nullptr),
				           report, language)
				           .dump() +
				       '\n';
			}
			auto read = formats::readProject(request["input"]["text"].get<std::string>(), inputFormat);
			static_cast<DiagnosticReport &>(report) = read;
			const bool strict = options.value("strict", false);
			if (!read.project || (strict && report.hasWarnings()))
				return envelope(requestId, false, nullptr, report, language).dump() + '\n';
			const auto &project = *read.project;
			if (op == "validate" || op == "import")
				result = json::parse(formats::writeJsonProject(project));
			else if (op == "render")
				result = format == "json" ? formats::renderRoute(project, render)
				                          : json{{"text", formats::renderTerminal(project, render)},
				                                 {"contentType", "text/plain"}};
			else if (op == "inspect")
				result = formats::inspectObject(project, options["id"]);
			else if (op == "hints")
				result = guidance::hints(project, language, profile);
			else if (op == "normalize" || op == "export") {
				std::string target = format;
				if (target == "auto") {
					auto raw = request["input"]["text"].get<std::string>();
					if (raw.starts_with("\xEF\xBB\xBF"))
						raw.erase(0, 3);
					const auto first = raw.find_first_not_of(" \t\r\n");
					target = inputFormat == "json" || (first != std::string::npos && raw[first] == '{')
					             ? "json"
					             : "roadmap-text";
				}
				if (target == "markdown")
					result = {{"text", formats::exportProjectMarkdown(project, render.routeId,
					                                                  options.value("dialect", "standard") ==
					                                                      "obsidian")},
					          {"contentType", "text/markdown"},
					          {"format", "markdown"}};
				else
					result = {{"text", target == "json" ? formats::writeJsonProject(project)
					                                    : formats::writeTextProject(project)},
					          {"contentType", target == "json" ? "application/json" : "text/plain"},
					          {"format", target}};
			}
		}
		if ((op == "help" || op == "explain") && format == "markdown")
			result["text"] =
			    "# " +
			    (op == "help" ? options.value("topic", "getting-started") : options.value("code", "")) +
			    "\n\n" + result["text"].get<std::string>() + '\n';
		if (op == "hints" && format != "json") {
			std::string text;
			for (const auto &item : result["items"])
				text += (format == "markdown" ? "- " : "") + item["entityId"].get<std::string>() + ": " +
				        item["question"].get<std::string>() + " " + item["reason"].get<std::string>() +
				        '\n';
			result["text"] = text;
		}
		return envelope(requestId, true, result, report, language).dump() + '\n';
	} catch (const std::invalid_argument &error) {
		return fail("E_REF_NOT_FOUND", error.what());
	} catch (const json::exception &error) {
		return fail("E_COMMAND", error.what());
	} catch (const std::exception &error) {
		return fail("E_INTERNAL", error.what());
	}
}
} // namespace roadmap
