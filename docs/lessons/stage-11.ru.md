# Stage 11

## 1. Что получаем

Перенести исходную схему 1 с отчётом добавленных трактовок. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `CMakeLists.txt`
- `TRACE.md`
- `apps/roadmap-cli/composition-root.cpp`
- `docs/guidance/catalog.json`
- `docs/legacy/schema-1-source.plan.md`
- `packages/roadmap-formats/src/embedded-resources.hpp.in`
- `packages/roadmap-formats/src/json-project.cpp`
- `packages/roadmap-formats/src/migrate-project-v1.cpp`
- `packages/roadmap-formats/src/migrate-project-v1.hpp`
- `packages/roadmap-formats/src/strict-json.hpp`
- `packages/roadmap-guidance/guidance.cpp`
- `packages/roadmap-wasm/roadmap-api.cpp`
- `schema/roadmap-project-v1.schema.json`
- `test/fixtures/minimal-v1.roadmap.json`
- `tests/migrate-project-v1.test.cpp`

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

Следующий этап: Stage 12.
