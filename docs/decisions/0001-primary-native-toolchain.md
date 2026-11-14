# Decision 0001 — Primary native toolchain

- **Status**: accepted.
- **Decision**: первая native-среда проекта — Windows + MinGW-w64 GCC + CMake + Ninja; отладчик — GDB.
- **Reason**: это уже установленная и исторически используемая автором учебная среда C++; она уменьшает количество одновременно меняющихся инструментов во время освоения языка.
- **Build consequence**: native presets выбирают `g++.exe`, но не закрепляют персональный абсолютный путь. Компилятор должен разрешаться через `PATH`; локально подтверждён путь `C:\Portable\MinGW-w64\bin\g++.exe`.
- **Debugger consequence**: Stage 00 проверяет breakpoint в `main` через GDB.
- **Portability consequence**: MSVC и отдельный Linux/Clang контур остаются будущими portability gates. Build-кэши разных toolchain не смешиваются.
- **Wasm consequence**: Emscripten компилирует те же C++-исходники в отдельном build-каталоге; native MinGW объектные файлы не переиспользуются.
- **Relation to plan**: `roadmap-editor.plan.md` сохраняется как исторический источник ТЗ. Его WSL/Linux default заменён настоящей принятой проектной адаптацией.
