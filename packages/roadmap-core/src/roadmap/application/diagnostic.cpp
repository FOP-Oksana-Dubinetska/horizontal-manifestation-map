#include "diagnostic.hpp"
#include <algorithm>
namespace roadmap {
void DiagnosticReport::add(Diagnostic diagnostic) {
	containsError = containsError || diagnostic.severity == "error";
	containsWarning = containsWarning || diagnostic.severity == "warning";
	if (diagnostics.size() >= 200) {
		diagnosticsTruncated = true;
		if (diagnostic.severity == "error" &&
		    std::none_of(diagnostics.begin(), diagnostics.end(),
		                 [](const auto &d) { return d.severity == "error"; }))
			diagnostics.back() = std::move(diagnostic);
		return;
	}
	diagnostics.push_back(std::move(diagnostic));
}
bool DiagnosticReport::hasErrors() const {
	return containsError || std::any_of(diagnostics.begin(), diagnostics.end(),
	                                    [](const auto &d) { return d.severity == "error"; });
}
bool DiagnosticReport::hasWarnings() const {
	return containsWarning || std::any_of(diagnostics.begin(), diagnostics.end(),
	                                      [](const auto &d) { return d.severity == "warning"; });
}
} // namespace roadmap
