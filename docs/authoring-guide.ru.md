# Working with an architecture map

A map begins with an intention: a result worth making explicit. Every intention immediately appears as the origin of a horizontal line, and several intentions and alternative routes can be developed together. Components describe the architecture; contracts and explanations record the reasoning. A route links those components to implementation steps. The same component can appear in several routes while keeping one identity.

## From an idea to a route

1. Create a map or explore the architecture example in the file menu.
2. Add an intention and its acceptance criteria, one criterion per line.
3. Add components and explanatory contracts. Choose links by name; the editor creates stable IDs.
4. Select an intention and create its route. Add steps, then link each step to the components and contracts it uses.
5. Use the edit buttons to revise text, criteria, links, order and estimates. Selecting a step highlights its related text and architecture.

A form checks the complete proposed change before applying it. If a link is inconsistent, the map and the text in the form remain available for correction. Cancel or Escape closes the form. Deletion first shows the affected objects and references, giving you a chance to inspect the result before applying it.

## Available actions and intersections

Creation starts with an intention. A route requires a selected intention; a step requires a selected route. Select a line to establish the context, then use its route or step action. Disabled buttons explain their prerequisite. Existing imported records remain editable.

An intersection names a relationship between at least two different intentions, steps, components or explanations. For example, two steps may rely on one validation contract. Choose its sources and describe the connection; submission becomes available after two sources are selected. Routes and estimates are excluded. Actual component reuse is expressed by multiple steps referencing the same component ID.

English is the default language; Ukrainian and Russian are available in the workspace. The configs are locales/en.json, uk.json and ru.json. Language changes labels, help and diagnostics while preserving authored text and IDs. The pristine, unsaved bundled example also has a complete translation in each language. An accepted edit or explicit save makes its text author-controlled. File → Architecture example opens a fresh version in the selected language. Close an editing form before switching language; its unfinished text is protected meanwhile.

The vertical source uses regular monospaced `<<…>>` names for all sections. Headings retain their semantic levels and keyboard navigation with the same compact visual size. How to work and About this project are adjacent top links; GitHub appears before Licenses in the footer. Help is a permanent anchor section outside the editor. CLI uses the same map: `hmap render map.roadmap.json` shows all lines, and `--route=r-id` selects one route. Try `hmap help workflow --lang=uk` or `hmap help intersections --lang=ru`.

## Save, reopen and share

Save keeps the accepted map in this browser. The file menu opens other saved maps or makes an independent copy. JSON carries a map to another browser through import; Markdown provides a readable plan. Import shows the proposed replacement before acceptance, and saving remains a separate action.

The status line points out unsaved changes or a storage issue. Downloading JSON is a useful way to keep a portable copy. Browser storage belongs to an origin, so moving between a pages.dev address and a custom domain uses that same export/import route.

## Read the idea behind the tool

The short section before the footer connects HMAP to the earlier review of Knuth's *Literate Programming*. English is visible, with Russian and Ukrainian translations below. Page scrolling moves freely through the workspace, help and introduction. The section links also work with a keyboard or touch.

The same English introduction appears when `hmap` starts in a terminal. Its wording comes from `content/project-introduction.json`, shared with the static website. The technical embedding example demonstrates two independent editors; its Host button helps check that editor styles leave the surrounding page intact.

<details><summary><strong>Русский</strong></summary>

Карта начинается с намерения и критериев результата. Затем добавляются компоненты, контракты, маршрут и связанные шаги. Один компонент может участвовать в нескольких маршрутах, сохраняя общий ID. Кнопки «Изменить» открывают формы; нажатие шага выделяет относящиеся к нему элементы.

Форма проверяет изменение целиком. При ошибке исходная карта и введённый текст остаются доступными. Перед удалением можно просмотреть затронутые объекты и ссылки. «Сохранить» записывает карту в этот браузер; меню «Файл» открывает другие карты, создаёт копию и скачивает JSON или Markdown. Импорт предлагает замену до её применения.

Текст перед футером объясняет идею HMAP и её связь с литературным программированием. Каждое намерение сразу появляется началом линии; несколько линий видны вместе. Шаг требует выбранного маршрута, пересечение — двух выбранных источников. Интерфейс и нетронутый стартовый пример доступны на EN/UK/RU. После изменения или сохранения текст карты остаётся авторским. Секции чтения обозначены компактными метками `<<…>>`; справка и описание проекта доступны из шапки, прокрутка свободная. Ссылки перехода доступны клавиатурой и на сенсорном экране. То же английское вступление выводится при запуске `hmap` в терминале.

</details>

<details><summary><strong>Українська</strong></summary>

Карта починається з наміру та критеріїв результату. Далі додаються компоненти, контракти, маршрут і зв'язані кроки. Один компонент може брати участь у кількох маршрутах, зберігаючи спільний ID. Кнопки редагування відкривають форми; натискання кроку виділяє пов'язані з ним елементи.

Форма перевіряє зміну цілком. За помилки вихідна карта та введений текст залишаються доступними. Перед видаленням можна переглянути відповідні об'єкти й посилання. Збереження записує карту в цей браузер; меню файлів відкриває інші карти, створює копію та завантажує JSON або Markdown. Імпорт показує запропоновану заміну до її застосування.

Текст перед футером пояснює ідею HMAP та її зв'язок із літературним програмуванням. Кожен намір одразу починає лінію; кілька ліній видно разом. Крок потребує вибраного маршруту, перетин — двох вибраних джерел. Інтерфейс і незмінений початковий приклад доступні EN/UK/RU. Після редагування або збереження текст карти залишається авторським. Секції читання позначено компактними мітками `<<…>>`; довідка й опис проєкту доступні з верхньої панелі, прокручування вільне. Посилання переходу доступні з клавіатури та на сенсорному екрані. Той самий англійський вступ виводиться під час запуску `hmap` у терміналі.

</details>
