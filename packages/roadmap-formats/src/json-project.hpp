#pragma once
#include <roadmap/application/diagnostic.hpp>
#include <roadmap/domain/roadmap-project.hpp>
#include <string_view>
namespace roadmap::formats {
struct ProjectReadResult : DiagnosticReport {
	std::optional<RoadmapProject> project;
};
bool isValidUtf8(std::string_view text);
ProjectReadResult readJsonProject(std::string_view text);
std::string writeJsonProject(const RoadmapProject &project);
std::string projectSchema();
std::string projectTemplate();
} // namespace roadmap::formats
