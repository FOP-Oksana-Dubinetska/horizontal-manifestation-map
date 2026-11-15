# SCENARIOS

Редакция: 2026-11-11. Точные AC-01–AC-35 приведены в docs/acceptance-matrix.ru.md.

## Scenario: `SC-00 workspace-foundation`

- **Purpose**: Воспроизводимая среда.
- **Input**: корректные и отрицательные фикстуры по §18; §20 Stage 00.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: native configure/build/CTest и исторический debugger gate.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-01 core-domain-model`

- **Purpose**: Модель с владением значениями и ID-связями.
- **Input**: корректные и отрицательные фикстуры по §5; §20 Stage 01.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/roadmap-project.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-02 native-cli-shell`

- **Purpose**: Типизированный парсер и внешние потоки.
- **Input**: корректные и отрицательные фикстуры по §8.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/cli-shell.test.cpp и tools/test-cli-contracts.py.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-03 wasm-portability-probe`

- **Purpose**: Те же C++-исходники в Wasm.
- **Input**: корректные и отрицательные фикстуры по §12.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/wasm/probe.mjs; parity.mjs.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-04 roadmap-json-boundary`

- **Purpose**: Строгая схема 2 и сериализация.
- **Input**: корректные и отрицательные фикстуры по §5–6.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/json-project.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-05 roadmap-model-validation`

- **Purpose**: Согласованность ID, ссылок и состояний.
- **Input**: корректные и отрицательные фикстуры по §9.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/project-validation.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-06 roadmap-text-protocol`

- **Purpose**: Обратимый RoadmapText/1.
- **Input**: корректные и отрицательные фикстуры по §6.3–6.6.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/roadmap-text.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-07 roadmap-route-view`

- **Purpose**: Один маршрут и inspect.
- **Input**: корректные и отрицательные фикстуры по §10.1–10.2.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/project-views.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-08 roadmap-guidance`

- **Purpose**: Единая методическая помощь.
- **Input**: корректные и отрицательные фикстуры по §7; §11.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/roadmap-api.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-09 roadmap-storage`

- **Purpose**: Явные файловые и браузерные записи.
- **Input**: корректные и отрицательные фикстуры по §13.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/file-output.test.cpp; tests/web/storage.test.ts.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-10 markdown-export`

- **Purpose**: Детерминированная литературная проекция.
- **Input**: корректные и отрицательные фикстуры по §10.3–10.4.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/markdown-export.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-11 roadmap-format-migration`

- **Purpose**: Явная миграция исходной схемы 1.
- **Input**: корректные и отрицательные фикстуры по §19.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/migrate-project-v1.test.cpp.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-12 embeddable-ui-shell`

- **Purpose**: Публичная фабрика и жизненный цикл.
- **Input**: корректные и отрицательные фикстуры по §14.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tests/browser/editor.spec.ts.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-13 web-demo`

- **Purpose**: Статический потребитель и поставка.
- **Input**: корректные и отрицательные фикстуры по §15.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: tools/check-distribution.py; browser root/nested scenarios.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-14 validation-pass`

- **Purpose**: Сводная приёмка кандидата.
- **Input**: корректные и отрицательные фикстуры по §21.
- **Expected result**: объявленный контракт соблюдён; ошибочный кандидат сохраняет исходный проект.
- **Validation method**: python tools/check-project.py --profile all.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json и TRACE.md.
- **Notes**: ручное принятие владельцем фиксируется отдельно от автоматической проверки.

## Scenario: `SC-HUMAN author and public hosting acceptance`

- **Purpose**: подтвердить понимание автора и фактическое размещение.
- **Input**: законченный кандидат и паспорт сайта.
- **Expected result**: автор воспроизводит §21.2, выполняет новый Windows gate и проверяет опубликованный домен.
- **Validation method**: docs/acceptance-matrix.ru.md; docs/cloudflare-site-passport.ru.md.
- **Test-backing status**: manual-review-only
- **Evidence path or command**: отдельная будущая запись TRACE с фактическим SHA и адресом.

## Scenario: `SC-15 authoring-workspace`

- **Purpose**: Создать архитектурную карту через формы и сохранить проверяемую связь с маршрутом.
- **Input**: пустой проект, редактирование текста и связей, удаление и перестановка, readonly и запоздалая проверка.
- **Expected result**: контракт hmap-authoring.plan.md выполнен; отмена и ошибка сохраняют прежний проект; принятые изменения сохраняются явно и переживают reload.
- **Validation method**: tests/web/authoring.test.ts; tests/browser/authoring.spec.ts; регрессионный web/all profile.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json; TRACE.md; docs/lessons/stage-15.ru.md–stage-18.ru.md.
- **Notes**: содержательная приёмка и опубликованная CF-версия проверяются владельцем после применения диффов.

## Scenario: `SC-19 project-introduction`

- **Purpose**: Share a concise ideological introduction across the website and terminal while keeping the editor comfortable to navigate.
- **Input**: ordinary/strong wheel gestures, keyboard links, an open form, English terminal output, machine-readable CLI commands.
- **Expected result**: two fitted sections hold ordinary scrolling; stronger gestures move between sections; inner content, zoom and forms behave normally. Website and terminal share the English introduction; machine/artifact output retains its established bytes.
- **Validation method**: tools/test-cli-introduction.py; existing CLI contracts; tests/browser/sections.spec.ts; tools/check-distribution.py.
- **Test-backing status**: integration-test-backed
- **Evidence path or command**: build/check-reports/check-project.json; cli-introduction.json; TRACE.md.
