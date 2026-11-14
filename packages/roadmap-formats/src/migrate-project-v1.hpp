#pragma once
#include "json-project.hpp"
#include <nlohmann/json.hpp>
namespace roadmap::formats {
struct MigrationResult : ProjectReadResult {
	nlohmann::json migrationReport = nlohmann::json::array();
};
MigrationResult migrateProjectV1(std::string_view text);
} // namespace roadmap::formats
