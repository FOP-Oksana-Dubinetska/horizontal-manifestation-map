#include "composition-root.hpp"
#include "command-options.hpp"
#include "file-output.hpp"
#include "json-project.hpp"
#include "localization.hpp"
#include "project-introduction.hpp"
#include "project-views.hpp"
#include "roadmap-api.hpp"
#include <cstdio>
#include <cstdlib>
#include <fstream>
#ifdef _WIN32
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <io.h>
#include <windows.h>
#else
#include <sys/ioctl.h>
#include <unistd.h>
#endif
#include <iostream>
#include <nlohmann/json.hpp>
#include <sstream>
namespace roadmap::cli {
using nlohmann::json;
namespace {
bool errorTerminal() {
#ifdef _WIN32
	return _isatty(2) != 0;
#else
	return ::isatty(STDERR_FILENO) != 0;
#endif
}
bool outputTerminal(const std::ostream &output) {
	if (&output != &std::cout)
		return false;
#ifdef _WIN32
	return _isatty(1) != 0;
#else
	return ::isatty(STDOUT_FILENO) != 0;
#endif
}
void writeIntroduction(std::ostream &output, std::size_t width) {
	const auto wrap = [&](std::string_view text) {
		std::istringstream words{std::string{text}};
		std::string word;
		std::size_t column = 0;
		while (words >> word) {
			if (column && column + 1 + word.size() > width) {
				output << '\n';
				column = 0;
			}
			if (column) {
				output << ' ';
				++column;
			}
			output << word;
			column += word.size();
		}
		output << '\n';
	};
	wrap(introductionTitle);
	wrap(introductionText);
	output << introductionReview << "\n\n";
}
std::size_t terminalWidth() {
#ifdef _WIN32
	CONSOLE_SCREEN_BUFFER_INFO info{};
	if (GetConsoleScreenBufferInfo(GetStdHandle(STD_OUTPUT_HANDLE), &info))
		return static_cast<std::size_t>(
		    std::max<int>(40, info.srWindow.Right - info.srWindow.Left + 1));
#else
	winsize size{};
	if (::isatty(STDOUT_FILENO) && ::ioctl(STDOUT_FILENO, TIOCGWINSZ, &size) == 0 && size.ws_col)
		return std::max<std::size_t>(40, size.ws_col);
#endif
	return 120;
}
json failure(const std::string &code, const std::string &message) {
	return {{"apiVersion", 1},
	        {"requestId", nullptr},
	        {"ok", false},
	        {"result", nullptr},
	        {"diagnostics",
	         json::array(
	             {{{"code", code},
	               {"severity", "error"},
	               {"entityId", nullptr},
	               {"pointer", ""},
	               {"source", {{"line", nullptr}, {"columnBytes", nullptr}, {"byteOffset", nullptr}}},
	               {"message", message},
	               {"relatedIds", json::array()},
	               {"helpTopic", "commands"}}})},
	        {"diagnosticsTruncated", false}};
}
bool information(const std::string &op) {
	return op == "validate" || op == "render" || op == "inspect" || op == "help" || op == "explain" ||
	       op == "hints";
}
int exitCode(const json &response) {
	if (response["ok"] == true)
		return 0;
	int code = 7;
	for (const auto &d : response["diagnostics"]) {
		if (d["severity"] != "error")
			continue;
		const std::string c = d["code"];
		if (c == "E_COMMAND")
			return 2;
		if (c == "E_INPUT_LIMIT")
			return 5;
		if (c == "E_INTERNAL")
			return 6;
		if (c.starts_with("E_IO_") || c == "E_OUTPUT_EXISTS")
			return 4;
		code = 3;
	}
	return code;
}
int emit(const json &response, const std::string &op, const std::string &format,
         std::ostream &output, std::ostream &errors, bool color = false,
         const std::string &language = "en") {
	const bool envelope = information(op) && format == "json";
	if (envelope)
		output << response.dump(2) << '\n';
	if (!envelope)
		for (const auto &d : response["diagnostics"])
			errors << (color ? (d["severity"] == "error" ? "\x1b[31m" : "\x1b[33m") : "")
			       << d["code"].get<std::string>() << (color ? "\x1b[0m" : "") << " "
			       << formats::safeTerminal(d["pointer"].get<std::string>()) << ": "
			       << formats::safeTerminal(d["message"].get<std::string>()) << '\n';
	if (response["ok"] == true && !envelope) {
		const auto &result = response["result"];
		if (op == "migrate") {
			output << result["project"].dump(2) << '\n';
			errors << result["migrationReport"].dump(2) << '\n';
			return 0;
		}
		if (result.is_object() && result.contains("text"))
			output << result["text"].get<std::string>()
			       << (result["text"].get<std::string>().ends_with('\n') ? "" : "\n");
		else if (op == "validate")
			output << formats::locale(language)["map"]["valid"].get<std::string>() << '\n';
		else
			output << result.dump(2) << '\n';
	}
	return exitCode(response);
}
} // namespace
int runCli(int argc, char *argv[], std::istream &input, std::ostream &output,
           std::ostream &errors) {
	auto parsed = parseCommandOptions(argc, argv);
	if (!parsed.options) {
		std::string op = argc > 1 ? argv[1] : "help", format = "text";
		for (int i = 1; i < argc; ++i) {
			if (std::string(argv[i]) == "--format=json" ||
			    (std::string(argv[i]) == "--format" && i + 1 < argc &&
			     std::string(argv[i + 1]) == "json"))
				format = "json";
		}
		return emit(failure("E_COMMAND", parsed.error), op, format, output, errors);
	}
	const auto &o = *parsed.options;
	const bool useColor = std::getenv("NO_COLOR") == nullptr &&
	                      (o.color == "always" || (o.color == "auto" && errorTerminal())) &&
	                      (o.format.empty() || o.format == "text") && o.outputPath.empty();
	auto emitCurrent = [&](const json &response, const std::string &op, const std::string &format,
	                       std::ostream &out, std::ostream &err) {
		return emit(response, op, format, out, err, useColor, o.language);
	};

	if (o.kind == CommandKind::version) {
		output << "hmap " << HMAP_APP_VERSION << "\nschema 2\nRoadmapText 1\nAPI 1\n";
		return 0;
	}
	const auto op = operationName(o.kind);
	json options = {{"language", o.language}};
	if (!o.format.empty())
		options["format"] = o.format;
	if (o.strict)
		options["strict"] = true;
	if (o.fullWidth)
		options["fullWidth"] = true;
	if (o.routeId)
		options["routeId"] = *o.routeId;
	if (o.id)
		options["id"] = *o.id;
	if (o.topic)
		options["topic"] = *o.topic;
	if (o.code)
		options["code"] = *o.code;
	if (o.dialect)
		options["dialect"] = *o.dialect;
	if (o.glyphs)
		options["glyphs"] = *o.glyphs;
	if (o.width)
		options["width"] = *o.width;
	else if (o.kind == CommandKind::render && !o.fullWidth)
		options["width"] = terminalWidth();
	if (o.offset)
		options["offset"] = *o.offset;
	if (o.from)
		options["from"] = *o.from;
	if (o.to)
		options["to"] = *o.to;
	json request = {
	    {"apiVersion", 1}, {"requestId", nullptr}, {"operation", op}, {"options", options}};
	const auto format = o.format.empty() ? "text" : o.format;
	if (!o.inputPath.empty()) {
		std::ifstream file;
		if (o.inputPath != "-") {
			file.open(o.inputPath, std::ios::binary);
			if (!file)
				return emitCurrent(failure("E_IO_READ", "Cannot open input"), op, format, output, errors);
		}
		std::istream &source = o.inputPath == "-" ? input : file;
		std::string text;
		char buffer[65536];
		while (source) {
			source.read(buffer, sizeof(buffer));
			text.append(buffer, static_cast<std::size_t>(source.gcount()));
			if (text.size() > 8388608)
				return emitCurrent(failure("E_INPUT_LIMIT", "Input exceeds 8388608 bytes"), op, format,
				                   output, errors);
		}
		if (source.bad())
			return emitCurrent(failure("E_IO_READ", "Cannot read input"), op, format, output, errors);
		if (!formats::isValidUtf8(text))
			return emitCurrent(failure("E_INPUT_ENCODING", "Input must be valid UTF-8"), op, format,
			                   output, errors);
		request["input"] = {{"format", o.inputFormat}, {"text", text}};
	}
	auto response = json::parse(processRoadmapRequest(request.dump()));
	if (!o.outputPath.empty() && response["ok"] == true) {
		std::ostringstream content;
		emitCurrent(response, op, format, content, errors);
		if (const auto error = writeOutputFile(o.outputPath, o.inputPath, content.str(), o.overwrite))
			return emitCurrent(failure(error->code, error->message), op, format, output, errors);
		return 0;
	}
	if (response["ok"] == true && information(op) && format == "text" && o.outputPath.empty() &&
	    outputTerminal(output))
		writeIntroduction(output, terminalWidth());
	if (o.kind == CommandKind::help && !o.topic && response["ok"] == true && format == "text")
		output << "Usage: hmap COMMAND [INPUT] [OPTIONS]\nCommands: help template schema validate "
		          "import normalize render inspect hints explain export migrate\n\n";
	return emitCurrent(response, op, format, output, errors);
}
int runCli(int argc, char *argv[], std::ostream &output, std::ostream &errors) {
	return runCli(argc, argv, std::cin, output, errors);
}
} // namespace roadmap::cli
