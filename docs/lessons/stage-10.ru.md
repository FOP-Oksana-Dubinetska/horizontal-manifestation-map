# Stage 10

## 1. Что получаем

Экспортировать детерминированную литературную проекцию. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `CMakeLists.txt`
- `TRACE.md`
- `examples/hmap-development.roadmap.json`
- `packages/roadmap-formats/src/export-project-markdown.cpp`
- `packages/roadmap-formats/src/export-project-markdown.hpp`
- `packages/roadmap-wasm/roadmap-api.cpp`
- `tests/markdown-export.test.cpp`

## 3. Как проходит управление

Прикладная операция получает все необходимые значения явно и возвращает результат внешнему адаптеру. Побочные эффекты выполняются только владельцем соответствующего порта. Невалидный кандидат сохраняет последний принятый источник.

## 4. Проверка

Команды выполняются из корня проекта; Emscripten предварительно активируется для Wasm. CLI-привязка операций JSON/Text/inspect объединяется в Stage 08; до него проверяются самостоятельные библиотеки через CTest.

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
```

## 5. Фиксация результата

В TRACE уже включены фактически наблюдавшиеся проверки подготовленного кандидата. После собственного запуска добавьте локальный результат и имя среды. PASS означает проверенный технический контракт; содержательное принятие остаётся решением автора.

Следующий этап: Stage 11.
