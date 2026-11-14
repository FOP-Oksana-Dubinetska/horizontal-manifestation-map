#include "export-project-markdown.hpp"
#include "json-project.hpp"
#include <catch2/catch_test_macros.hpp>
using namespace roadmap::formats;
TEST_CASE("Markdown projection is deterministic and protects frontmatter", "[markdown]") {
	auto p = *readJsonProject(projectTemplate()).project;
	p.title = "quoted \" title\n---\ninjected: yes";
	p.chunks[0].body = "```cpp\nint value;\n```\n---\n<a>author text</a>";
	const auto out = exportProjectMarkdown(p);
	CHECK(out == exportProjectMarkdown(p));
	CHECK(out.find("contracts_complete: false") != std::string::npos);
	CHECK(out.find(p.chunks[0].body) != std::string::npos);
	CHECK(out.find("title: \"quoted \\\" title\\n---\\ninjected: yes\"") != std::string::npos);
	CHECK(exportProjectMarkdown(p, "r-check").find("Route slice: r-check") != std::string::npos);
}
