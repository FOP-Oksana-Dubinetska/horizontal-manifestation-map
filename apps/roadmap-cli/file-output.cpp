#include "file-output.hpp"
#include <algorithm>
#include <filesystem>
#include <random>
#include <system_error>
#ifdef _WIN32
#define NOMINMAX
#include <windows.h>
#else
#include <cerrno>
#include <fcntl.h>
#include <unistd.h>
#endif
namespace roadmap::cli {
std::optional<FileError> writeOutputFile(const std::string &name, const std::string &inputName,
                                         const std::string &bytes, bool overwrite) {
	namespace fs = std::filesystem;
	try {
		const auto destination = fs::path(std::u8string(name.begin(), name.end()));
		if (!inputName.empty() && inputName != "-") {
			const auto source = fs::path(std::u8string(inputName.begin(), inputName.end()));
			std::error_code ec;
			if (fs::weakly_canonical(source) == fs::weakly_canonical(destination) ||
			    (fs::equivalent(source, destination, ec) && !ec))
				return FileError{"E_IO_WRITE", "Input and output must be different files"};
		}
		struct Cleanup {
			fs::path path;
			~Cleanup() {
				std::error_code ec;
				fs::remove(path, ec);
			}
		};
		std::random_device random;
		fs::path temporary;
#ifdef _WIN32
		HANDLE handle = INVALID_HANDLE_VALUE;
		for (int attempt = 0; attempt < 32 && handle == INVALID_HANDLE_VALUE; ++attempt) {
			temporary = destination;
			temporary += ".hmap-tmp-" + std::to_string(random());
			handle = CreateFileW(temporary.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_NEW,
			                     FILE_ATTRIBUTE_NORMAL, nullptr);
			if (handle == INVALID_HANDLE_VALUE && GetLastError() != ERROR_FILE_EXISTS)
				return FileError{"E_IO_WRITE", "Cannot create temporary output"};
		}
		if (handle == INVALID_HANDLE_VALUE)
			return FileError{"E_IO_WRITE", "Cannot allocate unique temporary output"};
		Cleanup cleanup{temporary};
		std::size_t offset = 0;
		bool good = true;
		while (offset < bytes.size()) {
			DWORD written = 0;
			const auto part = static_cast<DWORD>(std::min<std::size_t>(bytes.size() - offset, 1u << 30));
			if (!WriteFile(handle, bytes.data() + offset, part, &written, nullptr) || written == 0) {
				good = false;
				break;
			}
			offset += written;
		}
		if (!CloseHandle(handle))
			good = false;
		if (!good)
			return FileError{"E_IO_WRITE", "Cannot complete temporary output"};
		if (!MoveFileExW(temporary.c_str(), destination.c_str(),
		                 overwrite ? MOVEFILE_REPLACE_EXISTING : 0)) {
			const auto error = GetLastError();
			return FileError{error == ERROR_ALREADY_EXISTS || error == ERROR_FILE_EXISTS
			                     ? "E_OUTPUT_EXISTS"
			                     : "E_IO_WRITE",
			                 "Cannot install output file"};
		}
#else
		int fd = -1;
		for (int attempt = 0; attempt < 32 && fd < 0; ++attempt) {
			temporary = destination;
			temporary += ".hmap-tmp-" + std::to_string(random());
			fd = ::open(temporary.c_str(), O_WRONLY | O_CREAT | O_EXCL, 0600);
			if (fd < 0 && errno != EEXIST)
				return FileError{"E_IO_WRITE", "Cannot create temporary output"};
		}
		if (fd < 0)
			return FileError{"E_IO_WRITE", "Cannot allocate unique temporary output"};
		Cleanup cleanup{temporary};
		std::size_t offset = 0;
		bool good = true;
		while (offset < bytes.size()) {
			const auto written = ::write(fd, bytes.data() + offset, bytes.size() - offset);
			if (written < 0 && errno == EINTR)
				continue;
			if (written <= 0) {
				good = false;
				break;
			}
			offset += static_cast<std::size_t>(written);
		}
		if (::close(fd) != 0)
			good = false;
		if (!good)
			return FileError{"E_IO_WRITE", "Cannot complete temporary output"};
		// link() supplies atomic no-clobber; checking exists() alone would leave a race.
		if (overwrite) {
			if (::rename(temporary.c_str(), destination.c_str()) != 0)
				return FileError{"E_IO_WRITE", "Cannot replace output"};
		} else if (::link(temporary.c_str(), destination.c_str()) != 0)
			return FileError{errno == EEXIST ? "E_OUTPUT_EXISTS" : "E_IO_WRITE",
			                 "Cannot install output without overwrite"};
#endif
		return std::nullopt;
	} catch (const std::exception &error) {
		return FileError{"E_IO_WRITE", error.what()};
	}
}
} // namespace roadmap::cli
