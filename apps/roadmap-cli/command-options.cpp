#include "command-options.hpp"
#include <charconv>
#include <map>
#include <set>
#include <string_view>
namespace roadmap::cli {
namespace {
const std::map<std::string, CommandKind> commands{
    {"help", CommandKind::help},           {"--version", CommandKind::version},
    {"schema", CommandKind::schema},       {"template", CommandKind::templateProject},
    {"validate", CommandKind::validate},   {"import", CommandKind::importProject},
    {"normalize", CommandKind::normalize}, {"render", CommandKind::render},
    {"inspect", CommandKind::inspect},     {"hints", CommandKind::hints},
    {"explain", CommandKind::explain},     {"export", CommandKind::exportProject},
    {"migrate", CommandKind::migrate}};
}
std::string operationName(CommandKind kind) {
	for (const auto &[name, value] : commands)
		if (value == kind)
			return name;
	return "";
}
ParseResult parseCommandOptions(int argc, char *argv[]) {
	CommandOptions o;
	auto fail = [](const std::string &message) -> ParseResult {
		return {std::nullopt, "hmap: " + message};
	};
	if (argc == 1)
		return {o, ""};
	if (std::string_view(argv[1]) == "--help" || std::string_view(argv[1]) == "-h") {
		if (argc == 2)
			return {o, ""};
		return fail("help alias takes no extra arguments");
	}
	if (!commands.contains(argv[1]))
		return fail("unknown command or option");
	o.kind = commands.at(argv[1]);
	std::set<std::string> seen;
	bool positional = false, afterSeparator = false, helpRequested = false;
	for (int i = 2; i < argc; ++i) {
		std::string token = argv[i];
		if (!afterSeparator && (token == "--help" || token == "-h")) {
			if (!seen.insert("help").second)
				return fail("duplicate help flag");
			helpRequested = true;
			continue;
		}
		if (token == "--" && !afterSeparator) {
			afterSeparator = true;
			continue;
		}
		if (!afterSeparator && token.starts_with("--")) {
			const auto eq = token.find('=');
			const auto key = token.substr(2, eq == token.npos ? token.npos : eq - 2);
			if (!seen.insert(key).second)
				return fail("duplicate flag --" + key);
			const bool boolean = key == "strict" || key == "overwrite" || key == "full-width";
			std::string value;
			if (boolean) {
				if (eq != token.npos)
					return fail("boolean flag takes no value");
			} else if (eq != token.npos)
				value = token.substr(eq + 1);
			else {
				if (i + 1 == argc)
					return fail("flag requires a value: --" + key);
				value = argv[++i];
			}
			if (key == "strict")
				o.strict = true;
			else if (key == "overwrite")
				o.overwrite = true;
			else if (key == "full-width")
				o.fullWidth = true;
			else if (key == "format")
				o.format = value;
			else if (key == "input-format")
				o.inputFormat = value;
			else if (key == "output")
				o.outputPath = value;
			else if (key == "lang")
				o.language = value;
			else if (key == "color")
				o.color = value;
			else if (key == "route")
				o.routeId = value;
			else if (key == "id")
				o.id = value;
			else if (key == "dialect")
				o.dialect = value;
			else if (key == "glyphs")
				o.glyphs = value;
			else if (key == "width" || key == "offset" || key == "from" || key == "to") {
				std::size_t number = 0;
				const auto result = std::from_chars(value.data(), value.data() + value.size(), number);
				if (result.ec != std::errc{} || result.ptr != value.data() + value.size())
					return fail("expected nonnegative integer for --" + key);
				if (key == "width")
					o.width = number;
				else if (key == "offset")
					o.offset = number;
				else if (key == "from")
					o.from = number;
				else
					o.to = number;
			} else
				return fail("unknown flag --" + key);
		} else {
			if (positional)
				return fail("extra positional argument");
			positional = true;
			if (o.kind == CommandKind::help)
				o.topic = token;
			else if (o.kind == CommandKind::explain)
				o.code = token;
			else
				o.inputPath = token;
		}
	}
	const bool input = o.kind == CommandKind::validate || o.kind == CommandKind::importProject ||
	                   o.kind == CommandKind::normalize || o.kind == CommandKind::render ||
	                   o.kind == CommandKind::inspect || o.kind == CommandKind::hints ||
	                   o.kind == CommandKind::exportProject || o.kind == CommandKind::migrate;
	if (input && o.inputPath.empty() && !helpRequested)
		return fail("input file or - is required");
	if (!input && !o.inputPath.empty())
		return fail("command takes no input");
	if (!input && seen.contains("input-format"))
		return fail("input-format is not applicable");
	if (o.kind == CommandKind::version && (!seen.empty() || positional))
		return fail("version takes no arguments");
	if (o.kind == CommandKind::inspect && !o.id && !helpRequested)
		return fail("inspect requires --id");
	if (o.kind == CommandKind::explain && !o.code && !helpRequested)
		return fail("explain requires a code");
	if (o.overwrite && o.outputPath.empty())
		return fail("overwrite requires --output");
	if (!std::set<std::string>{"auto", "always", "never"}.contains(o.color))
		return fail("invalid color mode");
	if (!std::set<std::string>{"auto", "json", "roadmap-text"}.contains(o.inputFormat))
		return fail("invalid input format");
	if (o.language != "ru" && o.language != "en" && o.language != "uk")
		return fail("invalid language");
	std::set<std::string> applicable{"format", "output", "overwrite", "lang", "color", "help"};
	if (input)
		applicable.insert("input-format");
	if (o.kind == CommandKind::render || o.kind == CommandKind::exportProject)
		applicable.insert("route");
	if (o.kind == CommandKind::render)
		for (const auto *k : {"width", "offset", "full-width", "glyphs"})
			applicable.insert(k);
	if (o.kind == CommandKind::inspect)
		applicable.insert("id");
	if (o.kind == CommandKind::exportProject)
		applicable.insert("dialect");
	if (o.kind == CommandKind::migrate) {
		applicable.insert("from");
		applicable.insert("to");
	}
	if (o.kind == CommandKind::validate || o.kind == CommandKind::importProject ||
	    o.kind == CommandKind::normalize || o.kind == CommandKind::exportProject ||
	    o.kind == CommandKind::render || o.kind == CommandKind::migrate)
		applicable.insert("strict");
	for (const auto &flag : seen)
		if (!applicable.contains(flag))
			return fail("flag is not applicable: --" + flag);
	std::set<std::string> formats{"text", "json"};
	if (o.kind == CommandKind::schema || o.kind == CommandKind::importProject ||
	    o.kind == CommandKind::migrate)
		formats = {"json"};
	if (o.kind == CommandKind::templateProject || o.kind == CommandKind::normalize)
		formats = {"json", "roadmap-text"};
	if (o.kind == CommandKind::exportProject)
		formats = {"json", "roadmap-text", "markdown"};
	if (o.kind == CommandKind::help || o.kind == CommandKind::hints || o.kind == CommandKind::explain)
		formats.insert("markdown");
	if (!o.format.empty() && !formats.contains(o.format))
		return fail("unsupported output format");
	if (o.width && *o.width < 40)
		return fail("minimum width is 40");
	if (o.fullWidth && (o.width || o.offset))
		return fail("full-width excludes width and offset");
	if (o.glyphs && *o.glyphs != "ascii" && *o.glyphs != "unicode")
		return fail("invalid glyph set");
	if (o.dialect && ((*o.dialect != "standard" && *o.dialect != "obsidian") ||
	                  (!o.format.empty() && o.format != "markdown")))
		return fail("invalid Markdown dialect");

	if (o.kind == CommandKind::migrate && (!o.from || !o.to || *o.from != 1 || *o.to != 2))
		return fail("migrate requires --from=1 --to=2");

	if (helpRequested)
		return {CommandOptions{}, ""};
	return {o, ""};
}
} // namespace roadmap::cli
