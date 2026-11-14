#pragma once
#include <roadmap/domain/roadmap-project.hpp>
namespace roadmap::formats {
std::string exportProjectMarkdown(const RoadmapProject &project,
                                  const std::optional<std::string> &routeId = {},
                                  bool obsidian = false);
}
