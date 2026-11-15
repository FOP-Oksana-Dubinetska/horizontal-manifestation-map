# Stage 09

## 1. Что получаем

Защитить запись файлов и обеспечить сменные браузерные адаптеры. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `.gitignore`
- `CMakeLists.txt`
- `TRACE.md`
- `apps/roadmap-cli/composition-root.cpp`
- `apps/roadmap-cli/file-output.cpp`
- `apps/roadmap-cli/file-output.hpp`
- `package-lock.json`
- `package.json`
- `packages/roadmap-storage/package.json`
- `packages/roadmap-storage/src/index.ts`
- `tests/file-output.test.cpp`
- `tests/web/storage.test.ts`
- `tsconfig.json`

## 3. Как проходит управление

Прикладная операция получает все необходимые значения явно и возвращает результат внешнему адаптеру. Побочные эффекты выполняются только владельцем соответствующего порта. Невалидный кандидат сохраняет последний принятый источник.

## 4. Проверка

Команды выполняются из корня проекта; Emscripten предварительно активируется для Wasm. CLI-привязка операций JSON/Text/inspect объединяется в Stage 08; до него проверяются самостоятельные библиотеки через CTest.

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
npm ci
npm run typecheck
npm run test:storage
```

## 5. Фиксация результата

В TRACE уже включены фактически наблюдавшиеся проверки подготовленного кандидата. После собственного запуска добавьте локальный результат и имя среды. Результаты помогут связать наблюдаемое поведение с контрактом этого этапа.

Следующий этап: Stage 10.
