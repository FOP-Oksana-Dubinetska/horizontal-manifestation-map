# HMAP — Горизонтальная карта проявлений

Кандидат MVP по `roadmap-editor.plan.md`: C++20 CLI → общий WASM-движок → публичный vanilla TypeScript editor. JSON схемы 2 хранит карту; RoadmapText/1 служит обратимым вводом; Markdown представляет литературный экспорт. Верхняя область редактора показывает текст, нижняя — один горизонтальный маршрут.

Рабочий каталог: `TheWorldOfCanon\at-work\horizontal-manifestation-map`. Предлагаемый отдельный репозиторий: `FOP-Oksana-Dubinetska/horizontal-manifestation-map`. Паспорт сайта: [docs/cloudflare-site-passport.ru.md](docs/cloudflare-site-passport.ru.md), предлагаемый адрес — `hmap.zhovten.games`.

## Порядок применения поставки

Примените диффы по `series.json` из архива передачи. Внешний `apply-series.py` сначала проверяет всю последовательность в изолированной копии и сверяет ожидаемые байты. Он сохраняет пользовательские изменения при несовпадении базы и сообщает конфликтующие пути. После применения выполните подготовку зависимостей и проверку ниже. В README архива приведены команды для монорепозитория и отдельного репозитория.

Журнал этапов — [TRACE.md](TRACE.md); карточки продолжения — [docs/lessons/completion-index.ru.md](docs/lessons/completion-index.ru.md). Авторские модель и тесты Stage 01 сохранены побайтно; их хеши проверяются автоматически.

## Подготовка среды

Native-профиль автора: Windows, MinGW-w64 GCC, CMake, Ninja, GDB. Независимая Linux/GCC-проверка и Emscripten выполняются в отдельных build-каталогах. Node 24, npm, Python 3, Git и активированный Emscripten 6.0.9 нужны разработчику; посетителю сайта нужен браузер.

Закреплённые версии и SHA находятся в `manifest/`. Подготовка является явно сетевым действием:

```powershell
python tools/prepare-dependencies.py
python tools/prepare-governance.py
npm ci
npx playwright install chromium firefox
```

Для Wasm установите emsdk 6.0.9 и активируйте его окружение. В PowerShell выполните из установленного emsdk:

```powershell
.\emsdk install 6.0.9
.\emsdk activate 6.0.9
. .\emsdk_env.ps1
```

В Bash: `./emsdk install 6.0.9`, `./emsdk activate 6.0.9`, затем `source ./emsdk_env.sh`. Перейдите обратно в каталог HMAP. `$env:EMSDK` / `$EMSDK` должен указывать на активированный SDK. CMake берёт toolchain из этого окружения; native-объекты в Wasm не используются.

`prepare-governance.py` подготавливает неизменяемые reference worktrees Конституции и лицензирования. Полная копия закреплённого PLW находится в `methodology/upstream/`; её policy gitlink переиспользует корневую `.licensing-policy`. Эти корпуса остаются источниками подготовки и не входят в dist.

## Native CLI

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
.\build\native-debug\bin\hmap.exe --version
.\build\native-debug\bin\hmap.exe template --format=roadmap-text --output draft.roadmap.txt
.\build\native-debug\bin\hmap.exe validate draft.roadmap.txt --format=json
.\build\native-debug\bin\hmap.exe import draft.roadmap.txt --output demo.roadmap.json
.\build\native-debug\bin\hmap.exe render demo.roadmap.json --glyphs=unicode
.\build\native-debug\bin\hmap.exe inspect demo.roadmap.json --id=m-validator
.\build\native-debug\bin\hmap.exe hints demo.roadmap.json --lang=ru --format=markdown
.\build\native-debug\bin\hmap.exe export demo.roadmap.json --output demo.md
```

В Linux исполняемый файл — `./build/native-debug/bin/hmap`. Полная справка: `hmap help commands`, протокол модели: `hmap help llm --format=markdown`, значения диагностик: `hmap explain E_REF_NOT_FOUND --lang=ru`.

Для файлов используйте `--output`, особенно в PowerShell 5.1: shell-перенаправление может перекодировать stdout в UTF-16. Вход `-` означает stdin; файловая перезапись требует `--overwrite`, а входной и выходной файлы должны различаться. Нормализация сохраняет metadata; даты устанавливает явное пользовательское сохранение через внешний Clock.

Коды завершения: 0 — успех; 2 — аргументы; 3 — документ/объект; 4 — I/O; 5 — лимит; 6 — внутренняя ошибка; 7 — strict отклонил предупреждения. Информационные команды с `--format=json` возвращают один API envelope; артефактные команды возвращают только артефакт. Образцы схемы 1 мигрируются явно:

```powershell
.\build\native-debug\bin\hmap.exe migrate test/fixtures/minimal-v1.roadmap.json --from=1 --to=2 --output migrated.roadmap.json
```

Отчёт миграции идёт в stderr. ID, даты и текстовые оценки сохраняются; каждое новое default-значение перечисляется в отчёте.

## Wasm и Web

```powershell
cmake --preset wasm-release
cmake --build --preset wasm-release
ctest --preset wasm-release --output-on-failure
npm run typecheck
npm run test:storage
npm run build
python tools/serve-dist.py --port 4173
```

Откройте `http://127.0.0.1:4173/`; вложенный тестовый alias — `/tools/roadmap/`. Публичный пакет — `dist/embed`; статический сайт — `dist/site`. Ресурсы JS/Wasm объединены хешем сборки. `file://` не является способом запуска.

Пример [docs/embedding-example.html](docs/embedding-example.html) после сборки обслуживается как `/embedding-example.html`. Он импортирует публичный пакет, создаёт два редактора с одним движком и явным MemoryStorage. Контракт встраивания: [docs/embedding.md](docs/embedding.md).

## Проверка кандидата

После подготовки зависимостей контрольный проход работает без установки и обновления пакетов:

```powershell
python tools/check-project.py --profile native
python tools/check-project.py --profile wasm
python tools/check-project.py --profile web
python tools/check-project.py --profile all
```

Профиль Wasm использует native runner для сравнения контрактов; сначала нужен native build. На Linux дополнительная проверка памяти: configure/build/ctest с preset `native-sanitize`. Скрипт сообщает реальный отказ, сохраняет отчёт в `build/check-reports` и проверяет неизменность tracked-файлов. Путь к уже установленному Chromium можно передать через `HMAP_CHROMIUM_PATH`; версия проверенного браузера записывается в отчёт приёмки.

Точная матрица ТЗ и ручные пункты: [docs/acceptance-matrix.ru.md](docs/acceptance-matrix.ru.md). Новая Windows-сборка файлового адаптера, самостоятельный проход автора и реальный публичный Cloudflare smoke остаются наблюдениями владельца. Проектный governance profile сохраняет статус draft до отдельного акта принятия; автоматические тесты подтверждают техническое поведение кандидата.

GitHub Actions workflow в `.github/workflows/checks.yml` становится активным после выделения каталога в корень отдельного репозитория. Для текущего монорепозитория его подключение на уровне корневого `.github/workflows` выполняется владельцем отдельно; Cloudflare может уже собирать проект по указанному Root directory.
