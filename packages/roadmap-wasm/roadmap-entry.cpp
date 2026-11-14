#include <emscripten/bind.h>
#include "roadmap-api.hpp"
#include <stdexcept>
#include <string>
#include <roadmap/domain/roadmap-project.hpp>

namespace {
std::string probe(const std::string& value) {
  roadmap::RoadmapProject project{};
  project.title = value;
  return project.title;
}
std::string probeException() {
  try { throw std::runtime_error("probe"); }
  catch (const std::exception&) { return "caught"; }
}
}
EMSCRIPTEN_BINDINGS(roadmap_engine) {
  emscripten::function("processRoadmapRequest", &roadmap::processRoadmapRequest);
  emscripten::function("probe", &probe);
  emscripten::function("probeException", &probeException);
}
