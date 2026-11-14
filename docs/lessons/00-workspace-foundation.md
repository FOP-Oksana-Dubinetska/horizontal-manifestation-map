# Этап 00 — workspace-foundation

Цель этапа — подтвердить Windows/MinGW-w64-среду до предметного C++.

## 1. Диагностика

Из обычного PowerShell в корне проекта:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\tools\diagnose-local-env.ps1
```

Обязательны `g++.exe`, `gdb.exe`, CMake, Ninja и Git. Emscripten относится к этапу 03.

## 2. Native gate

При смене toolchain удалите старый CMake cache:

```powershell
Remove-Item -Recurse -Force .\build -ErrorAction SilentlyContinue
```

Затем:

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
.\build\native-debug\bin\workspace-smoke.exe
```

Ожидаемый вывод:

```text
horizontal-manifestation-map workspace: ready
```

## 3. Debugger gate

```powershell
gdb .\build\native-debug\bin\workspace-smoke.exe
```

```text
(gdb) break main
(gdb) run
```

Выполнение должно остановиться в `apps/workspace-smoke/main.cpp` на `main`.

До прохождения native build/test/smoke и debugger gate этап 01 не начинается.
