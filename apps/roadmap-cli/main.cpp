#include "composition-root.hpp"
#include <iostream>

// Точка входа передаёт системные потоки внешнему слою CLI.
int main(int argc, char *argv[]) {
	return roadmap::cli::runCli(argc, argv, std::cout, std::cerr);
}
