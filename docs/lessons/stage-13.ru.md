# Stage 13

## 1. Что получаем

Проверить статический host, вложенный URL и настройки Cloudflare. Исходное ТЗ и его данные остаются опорой следующего шага.

## 2. Файлы этого диффа

- `TRACE.md`
- `apps/web-demo/index.html`
- `apps/web-demo/main.ts`
- `apps/web-demo/public/_headers`
- `apps/web-demo/public/embedding-example.css`
- `apps/web-demo/public/embedding-example.js`
- `apps/web-demo/style.css`
- `docs/cloudflare-site-passport.ru.md`
- `docs/embedding-example.html`
- `licenses/CC-BY-SA-4.0.txt`
- `licenses/MIT.txt`
- `licenses/NOTICE.txt`
- `licenses/third-party/compiler-rt.txt`
- `licenses/third-party/emscripten.txt`
- `licenses/third-party/libcxx.txt`
- `licenses/third-party/libcxxabi.txt`
- `licenses/third-party/libunwind.txt`
- `licenses/third-party/musl.txt`
- `licenses/third-party/nlohmann-json.txt`
- `licenses/third-party/vite.txt`
- `playwright.config.ts`
- `tests/browser/editor.spec.ts`
- `tools/build-web.mjs`
- `tools/check-distribution.py`
- `tools/cloudflare-build.sh`
- `tools/serve-dist.py`

## 3. Как проходит управление

Host владеет движком и storage. Фабрика редактора ожидает готовность, проверяет исходный проект и создаёт собственный DOM. ViewState меняется отдельно от JSON; уничтожение редактора сохраняет общий engine. Worker использует те же C++-операции, что native CLI.

## 4. Проверка

Команды выполняются из корня проекта; Emscripten предварительно активируется для Wasm. CLI-привязка операций JSON/Text/inspect объединяется в Stage 08; до него проверяются самостоятельные библиотеки через CTest.

```powershell
cmake --preset wasm-release
cmake --build --preset wasm-release
npm run build
npm run test:web
python tools/check-distribution.py
```

## 5. Фиксация результата

В TRACE уже включены фактически наблюдавшиеся проверки подготовленного кандидата. После собственного запуска добавьте локальный результат и имя среды. Результаты помогут связать наблюдаемое поведение с контрактом этого этапа.

Следующий этап: Stage 14.
