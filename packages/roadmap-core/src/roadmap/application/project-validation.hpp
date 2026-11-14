#pragma once
#include "diagnostic.hpp"
#include <roadmap/domain/roadmap-project.hpp>
namespace roadmap {
DiagnosticReport validateProject(const RoadmapProject &project);
}
