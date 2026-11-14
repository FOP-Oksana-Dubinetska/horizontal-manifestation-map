# Пока roadmap-core содержит только заголовочные типы.
# INTERFACE означает: цель сама не производит .obj/.a,
# но передаёт своим потребителям include-пути и требования компиляции.
add_library(roadmap-core INTERFACE)

# Дополнительное имя цели с namespace проекта.
# Позже по нему сразу будет видно, что это наша библиотека,
# а не внешняя зависимость.
add_library(hmap::roadmap-core ALIAS roadmap-core)

# Потребитель roadmap-core сможет писать:
#
#   #include <roadmap/domain/roadmap-project.hpp>
#
# вместо относительных путей вида ../../../packages/...
target_include_directories(roadmap-core
  INTERFACE
    "${CMAKE_CURRENT_SOURCE_DIR}/src"
)

# Потребителям этой библиотеки требуется C++20.
target_compile_features(roadmap-core INTERFACE cxx_std_20)