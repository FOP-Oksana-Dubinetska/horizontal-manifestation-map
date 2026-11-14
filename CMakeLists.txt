cmake_minimum_required(VERSION 3.25)

project(horizontal_manifestation_map VERSION 0.0.0 LANGUAGES CXX)

option(HMAP_ENABLE_TESTS "Build stage-00 tests" ON)
option(HMAP_ENABLE_SANITIZERS "Enable supported native sanitizers" OFF)
option(HMAP_WARNINGS_AS_ERRORS "Treat project warnings as errors" OFF)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

include(cmake/ProjectWarnings.cmake)
include(cmake/ProjectSanitizers.cmake)

# Предметное ядро карты.
add_subdirectory(packages/roadmap-core)

set(HMAP_DEPENDENCY_DIR "${CMAKE_SOURCE_DIR}/build/dependencies" CACHE PATH "Prepared sources")
if(NOT EXISTS "${HMAP_DEPENDENCY_DIR}/nlohmann/json.hpp")
  message(FATAL_ERROR "Run python tools/prepare-dependencies.py")
endif()
add_library(roadmap-application STATIC
  packages/roadmap-core/src/roadmap/application/diagnostic.cpp
  packages/roadmap-core/src/roadmap/application/project-validation.cpp)
target_link_libraries(roadmap-application PUBLIC hmap::roadmap-core)
add_library(roadmap-formats STATIC packages/roadmap-formats/src/json-project.cpp
  packages/roadmap-formats/src/roadmap-text.cpp
  packages/roadmap-formats/src/project-views.cpp
  packages/roadmap-formats/src/export-project-markdown.cpp
  packages/roadmap-formats/src/migrate-project-v1.cpp)
target_link_libraries(roadmap-formats PUBLIC roadmap-application)
target_include_directories(roadmap-formats PUBLIC packages/roadmap-formats/src)
target_include_directories(roadmap-formats SYSTEM PUBLIC "${HMAP_DEPENDENCY_DIR}")
file(READ "${CMAKE_SOURCE_DIR}/schema/roadmap-project-v2.schema.json" HMAP_SCHEMA)
file(READ "${CMAKE_SOURCE_DIR}/test/fixtures/minimal-v2.roadmap.json" HMAP_EXAMPLE)
file(READ "${CMAKE_SOURCE_DIR}/schema/roadmap-project-v1.schema.json" HMAP_LEGACY_SCHEMA)
configure_file(packages/roadmap-formats/src/embedded-resources.hpp.in
  "${CMAKE_BINARY_DIR}/generated/embedded-resources.hpp" @ONLY)
target_include_directories(roadmap-formats PRIVATE "${CMAKE_BINARY_DIR}/generated")
foreach(target roadmap-application roadmap-formats)
  hmap_enable_project_warnings(${target})
  hmap_enable_project_sanitizers(${target})
  if(EMSCRIPTEN)
    target_compile_options(${target} PRIVATE -fexceptions)
  endif()
endforeach()

file(READ "${CMAKE_SOURCE_DIR}/docs/guidance/catalog.json" HMAP_GUIDANCE)
configure_file(packages/roadmap-guidance/guidance-resources.hpp.in
  "${CMAKE_BINARY_DIR}/generated/guidance-resources.hpp" @ONLY)
add_library(roadmap-guidance STATIC packages/roadmap-guidance/guidance.cpp)
target_include_directories(roadmap-guidance PUBLIC packages/roadmap-guidance
  PRIVATE "${CMAKE_BINARY_DIR}/generated")
target_link_libraries(roadmap-guidance PUBLIC roadmap-formats)
add_library(roadmap-api STATIC packages/roadmap-wasm/roadmap-api.cpp)
target_include_directories(roadmap-api PUBLIC packages/roadmap-wasm)
target_link_libraries(roadmap-api PUBLIC roadmap-guidance)
target_compile_definitions(roadmap-api PRIVATE HMAP_APP_VERSION="${PROJECT_VERSION}")
foreach(target roadmap-api roadmap-guidance)
  hmap_enable_project_warnings(${target})
  hmap_enable_project_sanitizers(${target})
  if(EMSCRIPTEN)
    target_compile_options(${target} PRIVATE -fexceptions)
  endif()
endforeach()

if(NOT EMSCRIPTEN)
add_executable(workspace-smoke apps/workspace-smoke/main.cpp)
target_compile_features(workspace-smoke PRIVATE cxx_std_20)
hmap_enable_project_warnings(workspace-smoke)
hmap_enable_project_sanitizers(workspace-smoke)

set_target_properties(workspace-smoke PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)

# Учебное приложение Stage 01.
#
# Это ещё не CLI проекта.
# Приложение только создаёт модель в памяти
# и выводит её краткое описание.
add_executable(
    roadmap-model-demo
    apps/roadmap-model-demo/main.cpp
)

# Подключаем к приложению доменное ядро.
#
# Благодаря INTERFACE-библиотеке становятся
# доступны заголовки из packages/roadmap-core/src.
target_link_libraries(
    roadmap-model-demo
    PRIVATE
        hmap::roadmap-core
      hmap-cli-shell
      roadmap-formats
)

target_compile_features(
    roadmap-model-demo
    PRIVATE cxx_std_20
)

# Применяем стандартные настройки проекта.
hmap_enable_project_warnings(roadmap-model-demo)
hmap_enable_project_sanitizers(roadmap-model-demo)

# Помещаем исполняемый файл в build/.../bin.
set_target_properties(
    roadmap-model-demo PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin"
)

# Оболочка CLI доступна тестам без второго main().
add_library(hmap-cli-shell STATIC
  apps/roadmap-cli/command-options.cpp
  apps/roadmap-cli/composition-root.cpp
  apps/roadmap-cli/file-output.cpp
)
target_include_directories(hmap-cli-shell PUBLIC apps/roadmap-cli)
target_compile_definitions(hmap-cli-shell PRIVATE HMAP_APP_VERSION="${PROJECT_VERSION}")
target_compile_features(hmap-cli-shell PUBLIC cxx_std_20)
target_link_libraries(hmap-cli-shell PUBLIC roadmap-api)
hmap_enable_project_warnings(hmap-cli-shell)
hmap_enable_project_sanitizers(hmap-cli-shell)

add_executable(hmap apps/roadmap-cli/main.cpp)
target_link_libraries(hmap PRIVATE hmap-cli-shell)
hmap_enable_project_warnings(hmap)
hmap_enable_project_sanitizers(hmap)
set_target_properties(hmap PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

add_executable(hmap-api-runner apps/roadmap-api-runner/main.cpp)
target_link_libraries(hmap-api-runner PRIVATE roadmap-api)
set_target_properties(hmap-api-runner PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
hmap_enable_project_sanitizers(hmap-api-runner)

if(HMAP_ENABLE_TESTS)
  include(CTest)
  enable_testing()
  set(HMAP_DEPENDENCY_DIR "${CMAKE_SOURCE_DIR}/build/dependencies" CACHE PATH "Prepared dependency sources")
  if(NOT EXISTS "${HMAP_DEPENDENCY_DIR}/catch2/catch_amalgamated.cpp")
    message(FATAL_ERROR "Run python tools/prepare-dependencies.py before configuring tests")
  endif()
  add_library(hmap-catch STATIC "${HMAP_DEPENDENCY_DIR}/catch2/catch_amalgamated.cpp")
  add_library(Catch2::Catch2WithMain ALIAS hmap-catch)
  file(MAKE_DIRECTORY "${CMAKE_BINARY_DIR}/catch-include/catch2")
  file(WRITE "${CMAKE_BINARY_DIR}/catch-include/catch2/catch_test_macros.hpp"
       "#include <catch_amalgamated.hpp>\n")
  target_include_directories(hmap-catch PUBLIC
    "${HMAP_DEPENDENCY_DIR}/catch2" "${CMAKE_BINARY_DIR}/catch-include")
  list(APPEND CMAKE_MODULE_PATH "${HMAP_DEPENDENCY_DIR}/catch2")

  add_executable(
    workspace-foundation-tests
    tests/workspace-foundation.test.cpp
    tests/roadmap-project.test.cpp
    tests/cli-shell.test.cpp
    tests/json-project.test.cpp
    tests/project-validation.test.cpp
    tests/roadmap-text.test.cpp
    tests/project-views.test.cpp
    tests/roadmap-api.test.cpp
    tests/file-output.test.cpp
    tests/markdown-export.test.cpp
    tests/migrate-project-v1.test.cpp
  )
  target_link_libraries(
    workspace-foundation-tests
    PRIVATE
      Catch2::Catch2WithMain
      hmap::roadmap-core
      hmap-cli-shell
      roadmap-formats
  )
  target_compile_definitions(workspace-foundation-tests PRIVATE HMAP_SOURCE_DIR="${CMAKE_SOURCE_DIR}")
  target_compile_features(workspace-foundation-tests PRIVATE cxx_std_20)
  hmap_enable_project_warnings(workspace-foundation-tests)
  hmap_enable_project_sanitizers(workspace-foundation-tests)

  include(Catch)
  catch_discover_tests(workspace-foundation-tests)
endif()

endif() # Native executables and tests

if(EMSCRIPTEN)
  add_executable(roadmap-engine packages/roadmap-wasm/roadmap-entry.cpp)
  target_link_libraries(roadmap-engine PRIVATE roadmap-api)
  target_compile_options(roadmap-engine PRIVATE -fexceptions)
  target_link_options(roadmap-engine PRIVATE --no-entry -lembind -fexceptions
    -sINCOMING_MODULE_JS_API=wasmBinary,locateFile,print,printErr
    -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node
    -sDYNAMIC_EXECUTION=0 -sFILESYSTEM=0 -sALLOW_MEMORY_GROWTH=1 -sMAXIMUM_MEMORY=268435456)
  set_target_properties(roadmap-engine PROPERTIES SUFFIX ".mjs"
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/engine")
  enable_testing()
  find_program(HMAP_NODE node REQUIRED)
  add_test(NAME wasm-probe COMMAND "${HMAP_NODE}"
    "${CMAKE_SOURCE_DIR}/tests/wasm/probe.mjs" "$<TARGET_FILE:roadmap-engine>")
endif()
