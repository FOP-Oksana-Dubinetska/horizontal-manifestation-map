# CONTRACTS

Редакция: 2026-11-11. Контракты сводят границы и приёмку карточек §20 исходного ТЗ. Первые авторские этапы сохраняют историю в TRACE; текущая операция разрешена прямым поручением завершения. Наблюдаемый технический результат и содержательное принятие автора фиксируются раздельно.

## Chunk: `<<workspace-foundation>>`

- **Role**: Воспроизводимая среда.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §18; §20 Stage 00; данные передаются через объявленные порты.
- **Outputs**: CMake, presets, закреплённые зависимости.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: native configure/build/CTest и исторический debugger gate; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<core-domain-model>>`

- **Role**: Модель с владением значениями и ID-связями.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §5; §20 Stage 01; данные передаются через объявленные порты.
- **Outputs**: roadmap-project.hpp и авторские тесты.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/roadmap-project.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<native-cli-shell>>`

- **Role**: Типизированный парсер и внешние потоки.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §8; данные передаются через объявленные порты.
- **Outputs**: apps/roadmap-cli.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/cli-shell.test.cpp и tools/test-cli-contracts.py; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<wasm-portability-probe>>`

- **Role**: Те же C++-исходники в Wasm.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §12; данные передаются через объявленные порты.
- **Outputs**: Embind boundary, ES module и probe.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/wasm/probe.mjs; parity.mjs; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-json-boundary>>`

- **Role**: Строгая схема 2 и сериализация.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §5–6; данные передаются через объявленные порты.
- **Outputs**: schema и JSON reader/writer.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/json-project.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-model-validation>>`

- **Role**: Согласованность ID, ссылок и состояний.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §9; данные передаются через объявленные порты.
- **Outputs**: pure C++ validator.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/project-validation.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-text-protocol>>`

- **Role**: Обратимый RoadmapText/1.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §6.3–6.6; данные передаются через объявленные порты.
- **Outputs**: record scanner и text writer.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/roadmap-text.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-route-view>>`

- **Role**: Один маршрут и inspect.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §10.1–10.2; данные передаются через объявленные порты.
- **Outputs**: DTO, terminal view, usage reports.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/project-views.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-guidance>>`

- **Role**: Единая методическая помощь.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §7; §11; данные передаются через объявленные порты.
- **Outputs**: bilingual guidance catalog and API.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/roadmap-api.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-storage>>`

- **Role**: Явные файловые и браузерные записи.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §13; данные передаются через объявленные порты.
- **Outputs**: file output, Memory/LocalStorage and external Clock.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/file-output.test.cpp; tests/web/storage.test.ts; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<markdown-export>>`

- **Role**: Детерминированная литературная проекция.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §10.3–10.4; данные передаются через объявленные порты.
- **Outputs**: Markdown, frontmatter и self-hosting map.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/markdown-export.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<roadmap-format-migration>>`

- **Role**: Явная миграция исходной схемы 1.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §19; данные передаются через объявленные порты.
- **Outputs**: legacy shape, conversion and report.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/migrate-project-v1.test.cpp; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<embeddable-ui-shell>>`

- **Role**: Публичная фабрика и жизненный цикл.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §14; данные передаются через объявленные порты.
- **Outputs**: vanilla TS UI, Worker bridge and scoped CSS.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tests/browser/editor.spec.ts; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<web-demo>>`

- **Role**: Статический потребитель и поставка.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §15; данные передаются через объявленные порты.
- **Outputs**: host, versioned assets and CF passport.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: tools/check-distribution.py; browser root/nested scenarios; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<validation-pass>>`

- **Role**: Сводная приёмка кандидата.
- **Status**: candidate implementation; author acceptance pending.
- **Inputs**: roadmap-editor.plan.md §21; данные передаются через объявленные порты.
- **Outputs**: матрица, отчёты, последовательные диффы.
- **Allowed changes**: реализация этой ответственности, её адаптеров, тестов и пояснений в текущем проекте.
- **Forbidden changes**: изменение внешнего корпуса, скрытое расширение схемы/предметной области и публикация от имени владельца.
- **Acceptance criteria**: python tools/check-project.py --profile all; сбой сохраняет последний корректный источник; одинаковые входы дают стабильный результат.

## Chunk: `<<complete-mvp>>`

- **Role**: Подготовить целостный кандидат и проверяемую последовательную поставку.
- **Status**: LLM-fillable
- **Inputs**: hmap-completion.plan.md, исходное ТЗ, приложенный Stage 02.3a, фактический GitHub snapshot.
- **Outputs**: индексация кандидата, исходники, последовательные диффы, паспорт и фактические отчёты.
- **Allowed changes**: Stage 02.3a–14 в названном каталоге и их документированные проверки.
- **Forbidden changes**: автоматическое принятие/ратификация, DNS, внешняя публикация и изменение внешних методов.
- **Acceptance criteria**: all profile завершён с наблюдаемым результатом; патчи применены на чистую базу и дали ожидаемое дерево; ручные пункты явно перечислены.

## Chunk: `<<authoring-workspace>>`

- **Role**: Авторское изменение schema-2 карты и простой архитектурный workspace.
- **Status**: implementation candidate, authorised 2026-11-14; author acceptance pending.
- **Inputs**: hmap-authoring.plan.md, принятый RoadmapProject, пользовательские формы, единый engine.
- **Outputs**: проверенная атомарная замена, ровно один onChange; наглядные связи компонентов, контрактов и шагов.
- **Allowed changes**: Stage 15–18 в ограниченной программе, web UI, примеры, проверки и документы.
- **Forbidden changes**: изменение schema/core semantics, обход validator, скрытая запись storage, ослабление CSP для неизвестного script, внешняя публикация.
- **Acceptance criteria**: tests/web/authoring.test.ts; tests/browser/authoring.spec.ts; python tools/check-project.py --profile all; ошибочный/отменённый/устаревший кандидат сохраняет последнюю принятую карту; последовательные диффы воспроизводят дерево.

## Chunk: `<<project-introduction>>`

- **Role**: Explain the learning project and its readable-architecture idea across web and terminal.
- **Status**: implementation
- **Inputs**: hmap-presentation.plan.md; content/project-introduction.json; human terminal/section navigation.
- **Outputs**: English README with RU/UK disclosures; static multilingual introduction; terminal-only English banner; native section and anchor navigation.
- **Allowed changes**: presentation adapters, related build/test tools, current explanatory documentation and Stage 19 record.
- **Forbidden changes**: domain/schema changes, modified machine/artifact output, hidden storage writes, third-party method/policy edits.
- **Acceptance criteria**: native PTY/banner and existing CLI checks; Chromium/Firefox section navigation and modal isolation; static HTML credit/translation checks; web/native/Wasm profiles; clean single-patch replay.

## Chunk: `<<intention-led-map>>` — Stage 20

Default CLI/API render returns all intention-led lines in source order. Each intention appears even without routes; each route repeats its owning intention as the derived origin. No synthetic step is written to the project. Explicit --route / options.routeId returns a one-route slice. JSON render returns scope, empty, rows[{intent,route|null}], modules, chunks, intersections, estimates and an empty-state message. The earlier selected-route-only render DTO is superseded; renderRoute remains the explicit internal single-route helper. Selection fields retain their schema-2 meaning and no longer hide other lines. CLI, Wasm and web consume the same projection.

Presentation language is en (default), uk or ru. locales/*.json contain the translated map, guidance, labels and diagnostics. docs/guidance/catalog.json retains language-independent topic metadata. IDs, enum values, authored strings and JSON/RoadmapText transport remain unchanged. The terminal ideological header remains English as requested; machine output remains clean.

### Stage 21 — creation prerequisites

The interactive workflow starts with an intention. A route requires a selected intention; a step requires a selected route of that intention. Explicit null view selection stays null. An intersection requires two eligible intention/step/module/chunk sources; its form requires two selections before submit. Existing imported and programmatically supplied schema-2 projects retain their validation contract. Map DTO and accepted project change atomically; late projections, cancelled forms and rejected candidates retain the accepted pair.

### Stage 22 — language and navigation

`language` accepts en/uk/ru and defaults to en. `setLanguage` preserves project/view and emits no onChange; it returns false while a draft/review is open. The host stores this interface preference separately from maps and accepts an explicit ?lang=en|uk|ru override. Native wheel scrolling has no JS threshold or cancellation. Help is a permanent anchor section outside the editor and before the ideological introduction. Locale files own interface strings and guidance; their complete key sets are checked together.
