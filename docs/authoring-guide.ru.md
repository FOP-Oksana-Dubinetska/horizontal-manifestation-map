# Working with an architecture map

A map begins with an intention: a result worth making explicit. Components describe the architecture; contracts and explanations record the reasoning. A route links those components to implementation steps. The same component can appear in several routes while keeping one identity.

## From an idea to a route

1. Create a map or explore the architecture example in the file menu.
2. Add an intention and its acceptance criteria, one criterion per line.
3. Add components and explanatory contracts. Choose links by name; the editor creates stable IDs.
4. Select an intention and create its route. Add steps, then link each step to the components and contracts it uses.
5. Use the edit buttons to revise text, criteria, links, order and estimates. Selecting a step highlights its related text and architecture.

A form checks the complete proposed change before applying it. If a link is inconsistent, the map and the text in the form remain available for correction. Cancel or Escape closes the form. Deletion first shows the affected objects and references, giving you a chance to inspect the result before applying it.

## Save, reopen and share

Save keeps the accepted map in this browser. The file menu opens other saved maps or makes an independent copy. JSON carries a map to another browser through import; Markdown provides a readable plan. Import shows the proposed replacement before acceptance, and saving remains a separate action.

The status line points out unsaved changes or a storage issue. Downloading JSON is a useful way to keep a portable copy. Browser storage belongs to an origin, so moving between a pages.dev address and a custom domain uses that same export/import route.

## Read the idea behind the tool

The short section before the footer connects HMAP to the earlier review of Knuth's *Literate Programming*. English is visible, with Russian and Ukrainian translations below. Ordinary scrolling reads the current section; a stronger gesture moves between the workspace, introduction and footer. The section links also work with a keyboard or touch.

The same English introduction appears when `hmap` starts in a terminal. Its wording comes from `content/project-introduction.json`, shared with the static website. The technical embedding example demonstrates two independent editors; its Host button helps check that editor styles leave the surrounding page intact.

<details><summary><strong>Русский</strong></summary>

Карта начинается с намерения и критериев результата. Затем добавляются компоненты, контракты, маршрут и связанные шаги. Один компонент может участвовать в нескольких маршрутах, сохраняя общий ID. Кнопки «Изменить» открывают формы; нажатие шага выделяет относящиеся к нему элементы.

Форма проверяет изменение целиком. При ошибке исходная карта и введённый текст остаются доступными. Перед удалением можно просмотреть затронутые объекты и ссылки. «Сохранить» записывает карту в этот браузер; меню «Файл» открывает другие карты, создаёт копию и скачивает JSON или Markdown. Импорт предлагает замену до её применения.

Текст перед футером объясняет идею HMAP и её связь с литературным программированием. Обычная прокрутка читает текущую область, усиленный жест переводит к соседней секции. Ссылки перехода доступны клавиатурой и на сенсорном экране. То же английское вступление выводится при запуске `hmap` в терминале.

</details>

<details><summary><strong>Українська</strong></summary>

Карта починається з наміру та критеріїв результату. Далі додаються компоненти, контракти, маршрут і зв'язані кроки. Один компонент може брати участь у кількох маршрутах, зберігаючи спільний ID. Кнопки редагування відкривають форми; натискання кроку виділяє пов'язані з ним елементи.

Форма перевіряє зміну цілком. За помилки вихідна карта та введений текст залишаються доступними. Перед видаленням можна переглянути відповідні об'єкти й посилання. Збереження записує карту в цей браузер; меню файлів відкриває інші карти, створює копію та завантажує JSON або Markdown. Імпорт показує запропоновану заміну до її застосування.

Текст перед футером пояснює ідею HMAP та її зв'язок із літературним програмуванням. Звичайне прокручування читає поточну область, посилений жест переводить до сусідньої секції. Посилання переходу доступні з клавіатури та на сенсорному екрані. Той самий англійський вступ виводиться під час запуску `hmap` у терміналі.

</details>
