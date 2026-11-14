#pragma once
#include "json-project.hpp"
namespace roadmap::formats {
ProjectReadResult readTextProject(std::string_view text);
ProjectReadResult readProject(std::string_view text, std::string_view format = "auto");
std::string writeTextProject(const RoadmapProject &project);
} // namespace roadmap::formats
