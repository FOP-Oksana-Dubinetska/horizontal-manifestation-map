function(hmap_enable_project_sanitizers target_name)
  if(NOT HMAP_ENABLE_SANITIZERS)
    return()
  endif()

  if(MSVC)
    # MSVC provides AddressSanitizer. UndefinedBehaviorSanitizer is checked later
    # in a GCC/Clang portability profile rather than being falsely claimed here.
    target_compile_options(${target_name} PRIVATE /fsanitize=address)
  elseif(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    target_compile_options(${target_name} PRIVATE -fsanitize=address,undefined -fno-omit-frame-pointer)
    target_link_options(${target_name} PRIVATE -fsanitize=address,undefined)
  else()
    message(FATAL_ERROR "HMAP_ENABLE_SANITIZERS is ON, but this compiler profile is unsupported")
  endif()
endfunction()
