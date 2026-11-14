#pragma once
#include <nlohmann/json.hpp>
#include <roadmap/domain/roadmap-project.hpp>
namespace roadmap::guidance {
nlohmann::json catalog();
nlohmann::json help(const std::string &topic, const std::string &language,
                    const std::string &profile);
nlohmann::json explain(const std::string &code, const std::string &language);
nlohmann::json hints(const RoadmapProject &project, const std::string &language,
                     const std::string &profile);
} // namespace roadmap::guidance
