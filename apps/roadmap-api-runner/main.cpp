#include "roadmap-api.hpp"
#include <iostream>
#include <iterator>
int main(){
  const std::string request{std::istreambuf_iterator<char>(std::cin),{}};
  std::cout<<roadmap::processRoadmapRequest(request);
}
