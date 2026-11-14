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
