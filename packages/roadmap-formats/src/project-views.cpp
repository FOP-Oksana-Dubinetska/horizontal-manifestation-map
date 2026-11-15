#include "project-views.hpp"
#include "json-project.hpp"
#include "localization.hpp"
#include <algorithm>
#include <iomanip>
#include <sstream>
namespace roadmap::formats {
using nlohmann::json;
std::string safeTerminal(std::string_view value) {
	std::ostringstream out;
	for (std::size_t i = 0; i < value.size(); ++i) {
		const auto c = static_cast<unsigned char>(value[i]);
		if (c == 0xc2 && i + 1 < value.size() && static_cast<unsigned char>(value[i + 1]) >= 0x80 &&
		    static_cast<unsigned char>(value[i + 1]) <= 0x9f) {
			out << "\\u00" << std::hex << std::setw(2) << std::setfill('0')
			    << static_cast<unsigned>(static_cast<unsigned char>(value[++i])) << std::dec;
		} else if ((c < 32 && c != '\n' && c != '\t') || c == 127)
			out << "\\x" << std::hex << std::setw(2) << std::setfill('0') << static_cast<unsigned>(c)
			    << std::dec;
		else
			out << static_cast<char>(c);
	}
	return out.str();
}
json renderRoute(const RoadmapProject &project, const RenderOptions &options) {
	const auto id = options.routeId ? options.routeId : project.selectedRouteId;
	if (!id)
		return {{"empty", true},
		        {"message", "Select a route; the project has no selected route"},
		        {"route", nullptr},
		        {"intent", nullptr}};
	auto source = json::parse(writeJsonProject(project));
	for (const auto &route : source["routes"])
		if (route["id"] == *id) {
			for (const auto &intent : source["intents"])
				if (intent["id"] == route["intentId"])
					return {{"empty", false},
					        {"route", route},
					        {"intent", intent},
					        {"estimates", source["estimates"]},
					        {"modules", source["modules"]}};
		}
	throw std::invalid_argument("Route ID not found: " + *id);
}
json renderMap(const RoadmapProject &project, const RenderOptions &options) {
	const auto source = json::parse(writeJsonProject(project));
	json rows = json::array();
	if (options.routeId) {
		const auto slice = renderRoute(project, options);
		rows.push_back({{"intent", slice["intent"]}, {"route", slice["route"]}});
	} else {
		for (const auto &intent : source["intents"]) {
			bool found = false;
			for (const auto &route : source["routes"])
				if (route["intentId"] == intent["id"]) {
					rows.push_back({{"intent", intent}, {"route", route}});
					found = true;
				}
			if (!found)
				rows.push_back({{"intent", intent}, {"route", nullptr}});
		}
	}
	return {{"empty", rows.empty()},
	        {"scope", options.routeId ? "route" : "map"},
	        {"rows", rows},
	        {"modules", source["modules"]},
	        {"chunks", source["chunks"]},
	        {"intersections", source["intersections"]},
	        {"estimates", source["estimates"]},
	        {"message", locale(options.language)["map"]["start"]}};
}
json inspectObject(const RoadmapProject &project, const std::string &id) {
	const auto source = json::parse(writeJsonProject(project));
	json object, uses = json::array(), outgoing = json::array();
	std::string type;
	if (id == project.id) {
		object = source;
		type = "project";
	}
	for (const auto *key : {"intents", "routes", "modules", "chunks", "intersections", "estimates"})
		for (const auto &value : source[key]) {
			if (value["id"] == id) {
				object = value;
				type = key;
			}
			if (std::string(key) == "routes")
				for (const auto &step : value["steps"])
					if (step["id"] == id) {
						object = step;
						type = "step";
					}
		}
	if (object.is_null())
		throw std::invalid_argument("Object ID not found: " + id);
	auto refs = [&](const json &item, const std::string &path,
	                const std::optional<std::string> &routeId = {}) {
		for (auto it = item.begin(); it != item.end(); ++it) {
			const auto &key = it.key();
			if (key == "id")
				continue;
			if (key.ends_with("Id") && it.value() == id)
				uses.push_back({{"entityId", item.at("id")},
				                {"pointer", path + "/" + key},
				                {"routeId", routeId ? json(*routeId) : json(nullptr)}});
			if (key.ends_with("Ids") && it.value().is_array())
				for (const auto &ref : it.value())
					if (ref == id)
						uses.push_back({{"entityId", item.at("id")},
						                {"pointer", path + "/" + key},
						                {"routeId", routeId ? json(*routeId) : json(nullptr)}});
		}
	};
	refs(source, "");
	for (const auto *key : {"intents", "routes", "modules", "chunks", "intersections", "estimates"})
		for (std::size_t i = 0; i < source[key].size(); ++i) {
			const auto &item = source[key][i];
			const auto p = "/" + std::string(key) + "/" + std::to_string(i);
			refs(item, p);
			if (std::string(key) == "routes")
				for (std::size_t s = 0; s < item["steps"].size(); ++s)
					refs(item["steps"][s], p + "/steps/" + std::to_string(s), item["id"].get<std::string>());
		}
	for (auto it = object.begin(); it != object.end(); ++it)
		if (it.key().ends_with("Ids") || it.key().ends_with("Id"))
			outgoing.push_back({{"field", it.key()}, {"value", it.value()}});
	return {{"type", type}, {"object", object}, {"outgoing", outgoing}, {"uses", uses}};
}
std::string renderTerminal(const RoadmapProject &project, const RenderOptions &options) {
	const auto map = renderMap(project, options);
	const auto &copy = locale(options.language)["map"];
	if (map["empty"] == true)
		return copy["start"].get<std::string>() + '\n';
	std::string out;
	for (const auto &line : map["rows"]) {
		const auto &intent = line["intent"], &route = line["route"];
		const auto dto = json{{"intent", intent}, {"route", route}, {"estimates", map["estimates"]}};
		out += copy["intention"].get<std::string>() + " " + intent["id"].get<std::string>() + ": " +
		       safeTerminal(intent["title"].get<std::string>()) + '\n' +
		       safeTerminal(intent["summary"].get<std::string>()) + '\n';
		if (route.is_null())
			out += copy["noRoute"].get<std::string>() + '\n';
		else {
			out += copy["route"].get<std::string>() + " " + route["id"].get<std::string>() + ": " +
			       safeTerminal(route["title"].get<std::string>()) + '\n';
			if (route["steps"].empty())
				out += copy["emptyRoute"].get<std::string>() + '\n';
		}
		std::vector<std::vector<std::string>> cards;
		std::vector<std::size_t> widths;
		const auto cellCount = [](const std::string &value) {
			return static_cast<std::size_t>(std::count_if(
			    value.begin(), value.end(), [](unsigned char c) { return (c & 0xc0) != 0x80; }));
		};
		auto originTitle = safeTerminal(intent["title"].get<std::string>());
		std::replace(originTitle.begin(), originTitle.end(), '\n', ' ');
		std::replace(originTitle.begin(), originTitle.end(), '\t', ' ');
		std::vector<std::string> origin{"<<" + copy["intention"].get<std::string>() + ">>",
		                                intent["id"].get<std::string>(), originTitle};
		std::size_t originWidth = 0;
		for (const auto &row : origin)
			originWidth = std::max(originWidth, cellCount(row));
		cards.push_back(origin);
		widths.push_back(originWidth + 2);
		for (const auto &step : route.is_null() ? json::array() : route["steps"]) {
			out += step["id"].get<std::string>() + ": " + safeTerminal(step["title"].get<std::string>()) +
			       '\n';
			std::string estimate = "-";
			for (const auto &value : dto["estimates"])
				if (value["id"] == step["estimateId"]) {
					const auto type = value["value"]["type"].get<std::string>();
					if (type == "unknown")
						estimate = "?";
					else if (type == "not-applicable")
						estimate = "n/a";
					else if (type == "text")
						estimate = "text";
					else
						estimate = std::to_string(value["value"]["minMinutes"].get<long long>()) + ".." +
						           std::to_string(value["value"]["maxMinutes"].get<long long>()) + " " +
						           copy["minutes"].get<std::string>() + " " +
						           copy[value["value"]["metric"].get<std::string>()].get<std::string>();
				}
			std::vector<std::string> card{"<<" + step["stereotype"].get<std::string>() + ">>",
			                              step["id"].get<std::string>(),
			                              copy["estimate"].get<std::string>() + ": " + estimate};
			std::size_t width = 0;
			for (const auto &row : card)
				width = std::max(width, cellCount(row));
			cards.push_back(card);
			widths.push_back(width + 2);
		}
		const std::string vertical = options.unicode ? "│" : "|",
		                  horizontal = options.unicode ? "─" : "-";
		std::vector<std::vector<std::string>> grid(5);
		auto appendCells = [](std::vector<std::string> &row, const std::string &value) {
			for (std::size_t i = 0; i < value.size();) {
				const auto b = static_cast<unsigned char>(value[i]);
				const auto length = b < 128 ? 1 : b < 224 ? 2 : b < 240 ? 3 : 4;
				row.push_back(value.substr(i, length));
				i += length;
			}
		};
		for (std::size_t c = 0; c < cards.size(); ++c) {
			for (std::size_t r = 0; r < 5; ++r) {
				auto &cells = grid[r];
				if (c)
					appendCells(cells, r == 2 ? (options.unicode ? " ──→ " : " --> ") : "     ");
				if (r == 0 || r == 4) {
					appendCells(cells, options.unicode ? (r == 0 ? "┌" : "└") : "+");
					for (std::size_t j = 0; j < widths[c]; ++j)
						appendCells(cells, horizontal);
					appendCells(cells, options.unicode ? (r == 0 ? "┐" : "┘") : "+");
				} else {
					appendCells(cells, vertical + " " + cards[c][r - 1] +
					                       std::string(widths[c] - 1 - cellCount(cards[c][r - 1]), ' ') +
					                       vertical);
				}
			}
		}
		for (const auto &row : grid) {
			if (options.fullWidth) {
				for (const auto &cell : row)
					out += cell;
			} else {
				const auto start =
				    std::min(options.offset,
				             row.size() > options.width ? row.size() - options.width : std::size_t{0});
				const auto end = std::min(start + options.width, row.size());
				for (std::size_t i = start; i < end; ++i)
					out += (i == start && start > 0)            ? "<"
					       : (i + 1 == end && end < row.size()) ? ">"
					                                            : row[i];
			}
			out += '\n';
		}
		out += '\n';
	}
	return out;
}
} // namespace roadmap::formats
