#pragma once
#include <nlohmann/json.hpp>
#include <string>
namespace roadmap::formats {
// Compiled presentation resources; project strings and machine keys are untouched.
const nlohmann::json &locale(const std::string &language);
} // namespace roadmap::formats
