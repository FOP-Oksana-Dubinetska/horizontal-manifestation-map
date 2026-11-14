#pragma once
#include <nlohmann/json.hpp>
#include <roadmap/application/diagnostic.hpp>
#include <string_view>
namespace roadmap::formats {
struct JsonReadResult : DiagnosticReport {
	std::optional<nlohmann::json> value;
};
DiagnosticReport checkJsonShape(const nlohmann::json &value, const nlohmann::json &schema);
JsonReadResult readStrictJson(std::string_view text, std::size_t maxBytes = 8388608);
} // namespace roadmap::formats
