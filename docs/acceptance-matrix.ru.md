# Матрица приёмки MVP

Редакция: 2026-11-11. Это сопоставление §21 ТЗ с конкретными проверками кандидата. Фактический результат команды записывается в `build/check-reports/check-project.json`; ранние счётчики по этапам сохранены в TRACE. Ручное принятие автором и реальные действия с внешней инфраструктурой выполняются отдельно.

| ID | Предмет | Свидетельство |
| --- | --- | --- |
| AC-01 | Native build | native-debug CMake/CTest; real CLI integration |
| AC-02 | Общая Wasm-сборка | wasm-release probe, exception/UTF-8 boundary |
| AC-03 | Минимальный JSON | JSON round trip; API validate |
| AC-04 | Полный текст §6.4 | import `test/fixtures/minimal-v2.roadmap.txt`, JSON equality |
| AC-05 | Text round trip | roadmap-text.test.cpp; repeated canonical JSON |
| AC-06 | Повторный JSON-ключ | strict JSON tests and native/Wasm negative parity |
| AC-07 | Отсутствующая ссылка | project-validation.test.cpp; CLI E_REF_NOT_FOUND envelope |
| AC-08 | Неверный тип ссылки | domain test and CLI E_REF_TYPE |
| AC-09 | Коллизия ID | global-index test and CLI E_ID_DUPLICATE |
| AC-10 | Двойное вхождение шага | RoadmapText membership rejection |
| AC-11 | Происхождение с циклом | iterative DFS; chain in relatedIds; CLI negative case |
| AC-12 | Пустые состояния | empty-project CLI, empty-route validation and text round trip |
| AC-13 | Выбор маршрута | E_SELECTION test; browser view/project separation |
| AC-14 | Unknown с причиной | preserved variant and bilingual hint reason |
| AC-15 | Причина/границы оценки | domain and CLI errors |
| AC-16 | Повторное использование | inspect counts two route/step occurrences; annotation-only values |
| AC-17 | Markdown bytes | deterministic export and hostile YAML fixture |
| AC-18 | Native/Wasm равенство | tests/wasm/parity.mjs on the shared compiled service |
| AC-19 | JSON при CLI-ошибке | exact one-envelope stdout and nonzero exit; empty stderr |
| AC-20 | No-clobber | file-output.test.cpp and real CLI output-file checks |
| AC-21 | Сохранность при сбое | source/target alias and invalid-import checks; rejected browser import |
| AC-22 | Memory snapshots | adapter tests mutate save input and load result |
| AC-23 | Доступ и квота | adapter exceptions; browser temporary session and later quota failure |
| AC-24 | Повреждённые данные | corrupt storage load/list test; original bytes retained |
| AC-25 | Два экземпляра | public embedding page, CSS/DOM/state isolation and shared engine |
| AC-26 | Readonly и поздний ответ | import control absence; delayed validation race and destroy |
| AC-27 | Один длинный маршрут | terminal viewport and whole Unicode glyphs; narrow browser rail |
| AC-28 | Авторский HTML/ESC/кавычки | textContent import, terminal escaping, safe YAML quotes |
| AC-29 | Вложенный URL | root and /tools/roadmap/ HTTP browser checks; actual Wasm MIME |
| AC-30 | Самостоятельная помощь | bilingual catalog topics; CLI help/explain/hints; JSON/Markdown/text |
| AC-31 | Schema-1 migration | original 0.2.0 source, strict fixture, order/default report and CLI candidate |
| AC-32 | Чистый контроль | source byte snapshots; no install/formatter inside check-project.py |
| AC-33 | Ресурсные границы | input/depth/large ID checks, validator regulators and host error handling |
| AC-34 | Клавиатура и фокус | browser separator, controls, modal focus/escape and focus-visible CSS |
| AC-35 | Компоновка | browser literature/one route/three permitted controls; no side inspector |

Автоматические сценарии проверяют поведение заявленных функций. Авторское объяснение владения и самостоятельный проход §21.2 остаются учебной приёмкой автора. Новый Windows/MinGW файловый адаптер требует локальной сборки на его устройстве; Linux-результат её не подтверждает. Cloudflare Pages, выбранный поддомен, DNS и HTTPS требуют фактического размещения по паспорту, после которого в TRACE добавляются адрес и точный проверенный SHA.

Сохраняемые пределы: один активный writer LocalStorage, отсутствующая power-loss гарантия файловой записи, local-first без cloud sync, аннотации оценок без общего срока, текстовые codeRefs без проверки Git. Профиль governance и лицензирования является подготовленным кандидатом для принятия владельцем. Эти границы перечисляются при первом публичном выпуске.
