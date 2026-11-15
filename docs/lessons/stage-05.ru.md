# Stage 05

## 1. Что получаем

Проверить идентичность, ссылки, происхождение и состояния карты. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `CMakeLists.txt`
- `TRACE.md`
- `packages/roadmap-core/src/roadmap/application/project-validation.cpp`
- `packages/roadmap-core/src/roadmap/application/project-validation.hpp`
- `packages/roadmap-formats/src/json-project.cpp`
- `tests/project-validation.test.cpp`

## 3. Как проходит управление

Адаптер получает текст, проверяет форму и строит владеющий значениями кандидат. Валидатор разрешает ID-связи. Optional project появляется после успешной проверки. При отказе вызывающая сторона сохраняет прежнее состояние.

## 4. Проверка

Команды выполняются из корня проекта; Emscripten предварительно активируется для Wasm. CLI-привязка операций JSON/Text/inspect объединяется в Stage 08; до него проверяются самостоятельные библиотеки через CTest.

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
```

## 5. Фиксация результата

В TRACE уже включены фактически наблюдавшиеся проверки подготовленного кандидата. После собственного запуска добавьте локальный результат и имя среды. Результаты помогут связать наблюдаемое поведение с контрактом этого этапа.

Следующий этап: Stage 06.
