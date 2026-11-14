#pragma once
#include <optional>
#include <string>
#include <vector>
namespace roadmap {
// source coordinates are absent unless their exact byte position is known.
struct SourcePosition {
	std::optional<std::size_t> line, columnBytes, byteOffset;
};
struct Diagnostic {
	std::string code;
	std::string severity = "error";
	std::optional<std::string> entityId;
	std::string pointer;
	SourcePosition source;
	std::string message;
	std::vector<std::string> relatedIds;
	std::string helpTopic = "json";
};
struct DiagnosticReport {
	std::vector<Diagnostic> diagnostics;
	bool diagnosticsTruncated = false;
	bool containsError = false;
	bool containsWarning = false;
	void add(Diagnostic diagnostic);
	bool hasErrors() const;
	bool hasWarnings() const;
};
} // namespace roadmap
