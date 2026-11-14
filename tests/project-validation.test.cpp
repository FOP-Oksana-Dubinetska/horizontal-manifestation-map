#include "json-project.hpp"
#include <algorithm>
#include <catch2/catch_test_macros.hpp>
#include <roadmap/application/project-validation.hpp>
using namespace roadmap;
namespace {
RoadmapProject example() {
	return *formats::readJsonProject(formats::projectTemplate()).project;
}
bool has(const DiagnosticReport &r, const std::string &code) {
	return std::any_of(r.diagnostics.begin(), r.diagnostics.end(),
	                   [&](const auto &d) { return d.code == code; });
}
} // namespace
TEST_CASE("Validator resolves global IDs, reference types and selection", "[validation]") {
	auto project = example();
	CHECK_FALSE(validateProject(project).hasErrors());
	project.routes[0].steps[0].linkedModuleIds = {"m-missing", "i-check", "i-check"};
	project.chunks[0].id = project.modules[0].id;
	project.selectedIntentId.reset();
	const auto report = validateProject(project);
	for (const auto &code :
	     {"E_ID_DUPLICATE", "E_REF_NOT_FOUND", "E_REF_TYPE", "E_REF_DUPLICATE", "E_SELECTION"})
		CHECK(has(report, code));
	const auto report2 = validateProject(project);
	REQUIRE(report.diagnostics.size() == report2.diagnostics.size());
	for (std::size_t i = 0; i < report.diagnostics.size(); ++i)
		CHECK(report.diagnostics[i].pointer == report2.diagnostics[i].pointer);
}
TEST_CASE("Validator diagnoses lineage and continuous intention state", "[validation]") {
	auto project = example();
	project.intents[0].parentIntentIds = {project.intents[0].id};
	project.intents[0].kind = IntentKind::continuous;
	project.intents[0].status = IntentStatus::implemented;
	auto report = validateProject(project);
	CHECK(has(report, "E_INTENT_CYCLE"));
	CHECK(has(report, "E_INTENT_CONTINUOUS_STATUS"));
}
TEST_CASE("Validator preserves draft state and typed estimate meaning", "[validation]") {
	auto project = example();
	project.routes[0].steps.clear();
	project.estimates[0].basis.clear();
	auto report = validateProject(project);
	CHECK_FALSE(report.hasErrors());
	CHECK(has(report, "W_ROUTE_EMPTY"));
	CHECK(has(report, "W_ESTIMATE_BASIS_MISSING"));
	project.estimates[0].value = EstimateRange{EstimateMetric::effort, 20, 10};
	CHECK(has(validateProject(project), "E_ESTIMATE_RANGE"));
	project.estimates[0].value = EstimateUnknown{"  "};
	CHECK(has(validateProject(project), "E_ESTIMATE_REASON"));
}
TEST_CASE("Diagnostic truncation never hides an error behind warnings", "[validation]") {
	DiagnosticReport report;
	for (int i = 0; i < 210; ++i)
		report.add({"W_ROUTE_EMPTY", "warning", {}, "", {}, "warning", {}, "routes"});
	report.add({"E_SELECTION", "error", {}, "", {}, "error", {}, "references"});
	CHECK(report.diagnostics.size() == 200);
	CHECK(report.diagnosticsTruncated);
	CHECK(report.hasErrors());
}
TEST_CASE("Validator rejects resource counts before graph and diagnostic work", "[validation]") {
	auto p = example();
	p.modules.resize(10001);
	auto r = roadmap::validateProject(p);
	REQUIRE(r.hasErrors());
	CHECK(r.diagnostics.front().code == "E_INPUT_LIMIT");
	p = example();
	p.intents[0].parentIntentIds.resize(100001, "i-check");
	CHECK(roadmap::validateProject(p).diagnostics.front().code == "E_INPUT_LIMIT");
	p = example();
	p.routes[0].steps.resize(2001);
	CHECK(roadmap::validateProject(p).diagnostics.front().code == "E_INPUT_LIMIT");
}
