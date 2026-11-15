# Stage 06

## 1. Что получаем

Реализовать обратимый формальный ввод с явными блоками маршрута. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `CMakeLists.txt`
- `TRACE.md`
- `packages/roadmap-formats/src/json-project.cpp`
- `packages/roadmap-formats/src/roadmap-text.cpp`
- `packages/roadmap-formats/src/roadmap-text.hpp`
- `packages/roadmap-formats/src/strict-json.hpp`
- `tests/roadmap-text.test.cpp`

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

Следующий этап: Stage 07.
