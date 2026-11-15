#pragma once
#include <nlohmann/json.hpp>
#include <roadmap/domain/roadmap-project.hpp>
namespace roadmap::formats {
struct RenderOptions {
	std::optional<std::string> routeId;
	std::size_t width = 120, offset = 0;
	bool fullWidth = false, unicode = false;
	std::string language = "en";
};
nlohmann::json renderRoute(const RoadmapProject &project, const RenderOptions &options);
nlohmann::json renderMap(const RoadmapProject &project, const RenderOptions &options);
nlohmann::json inspectObject(const RoadmapProject &project, const std::string &id);
std::string renderTerminal(const RoadmapProject &project, const RenderOptions &options);
std::string safeTerminal(std::string_view value);
} // namespace roadmap::formats
