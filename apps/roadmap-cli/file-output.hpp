#pragma once
#include <optional>
#include <string>
namespace roadmap::cli {
struct FileError {
	std::string code, message;
};
std::optional<FileError> writeOutputFile(const std::string &path, const std::string &inputPath,
                                         const std::string &bytes, bool overwrite);
} // namespace roadmap::cli
