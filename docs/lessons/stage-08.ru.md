# Stage 08

## 1. Что получаем

Соединить CLI/Wasm общим API и единым каталогом помощи. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `CMakeLists.txt`
- `TRACE.md`
- `apps/roadmap-api-runner/main.cpp`
- `apps/roadmap-cli/command-options.cpp`
- `apps/roadmap-cli/command-options.hpp`
- `apps/roadmap-cli/composition-root.cpp`
- `apps/roadmap-cli/composition-root.hpp`
- `docs/guidance/catalog.json`
- `packages/roadmap-guidance/guidance-resources.hpp.in`
- `packages/roadmap-guidance/guidance.cpp`
- `packages/roadmap-guidance/guidance.hpp`
- `packages/roadmap-wasm/roadmap-api.cpp`
- `packages/roadmap-wasm/roadmap-api.hpp`
- `packages/roadmap-wasm/roadmap-entry.cpp`
- `tests/roadmap-api.test.cpp`
- `tests/wasm/parity.mjs`

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

В TRACE уже включены фактически наблюдавшиеся проверки подготовленного кандидата. После собственного запуска добавьте локальный результат и имя среды. Результаты помогут связать наблюдаемое поведение с контрактом этого этапа.

Следующий этап: Stage 09.
