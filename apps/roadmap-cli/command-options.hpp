#pragma once
#include <cstddef>
#include <optional>
#include <string>
namespace roadmap::cli {
enum class CommandKind {
	help,
	version,
	schema,
	templateProject,
	validate,
	importProject,
	normalize,
	render,
	inspect,
	hints,
	explain,
	exportProject,
	migrate
};
struct CommandOptions {
	CommandKind kind = CommandKind::help;
	std::string inputPath, outputPath, format, inputFormat = "auto", language = "en", color = "auto";
	std::optional<std::string> routeId, id, topic, code, dialect, glyphs;
	std::optional<std::size_t> width, offset, from, to;
	bool strict = false, overwrite = false, fullWidth = false;
};
struct ParseResult {
	std::optional<CommandOptions> options;
	std::string error;
};
ParseResult parseCommandOptions(int argc, char *argv[]);
std::string operationName(CommandKind kind);
} // namespace roadmap::cli
