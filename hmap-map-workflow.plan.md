# HMAP — intentions lead the map

2026-11-15 · Stages 20–22 · follows Stage 19.

## Chunk: `<<intention-led-map>>`

Every intention immediately appears at the origin of a horizontal line. Each route continues its intention's line; several intentions and routes remain visible in source order. The origin is derived from the intention, with its existing ID, rather than stored as a duplicate step. Selecting a line establishes the context for additions. Selecting a step reveals its architectural components and explanations above.

This request supersedes the single visible route restriction in roadmap-editor.plan.md §1.1, §5.9, §7 and §14 and the Stage 15–19 plans. Schema 2, RoadmapText/1 and API 1 remain current. Existing documents, authored steps, IDs, explicit save and cancellation remain valid. Interactive creation starts with an intention; existing imported architectural records remain valid even when unlinked.

The historical basis is §15 of code_constitution_zenodo_full_draft_ru(1).md: an intention passes through reusable system elements towards a result and may produce further intentions. The earlier MVP narrowed this to one selected route. Retrieved conversations confirm the CLI-first sequence and the applied Stage 19 tree e559201042ec829fb38432678bd3b62308564f05. They provide no complete verbatim transcript of the original discussion. The current request explicitly introduces several visible lines.

| Stage | Goal and named files | Contract and observable checks |
| --- | --- | --- |
| 20 | Shared C++/CLI map and locales: project-views, roadmap-api, guidance, command-options, CMake, locales, native/API/parity tests, contracts, TRACE, lesson | Project → ordered intention/route rows, including unrouted intentions. Default render shows the map; --route keeps an explicit slice. EN/UK/RU help, diagnostics and map messages use locale files. Empty/multiple-line/source-preservation/slice/parity checks. |
| 21 | Web workflow: authoring, authoring-form, editor, CSS, node/browser tests, TRACE, lesson | Accepted project + view → contextual actions and shared-engine rows. Start with an intention; route requires an intention, step a selected route, intersection two eligible sources and two selected sources. Cancellation and stale results preserve state. |
| 22 | Localized interface and navigation: locale configs, host, HTML/CSS, build, tests, docs, TRACE, lesson | English default, Ukrainian and Russian choices; language changes preserve map/view and remain deferred while a draft is open. Permanent anchor help precedes the introduction. Native scrolling replaces wheel capture. Check locales, unsaved text, anchors, ordinary wheel escape, mobile layout and ordered patch replay. |

Intersections name a relationship between at least two different intentions, steps, components or explanations. Routes and estimates are excluded. A relationship creates no step execution or scheduling dependency. Disabled actions show their prerequisite as visible text, also available on touch devices.

Delivery: sequential project-relative diffs, isolated preflight, checks and development log. Remote repositories, DNS and hosting remain outside this change.

<details><summary>Русский</summary>

Каждое намерение сразу начинает горизонтальную линию. Несколько намерений и вариантов маршрута видны вместе. Начальная карточка сохраняет ID намерения; отдельный дублирующий шаг ей не нужен. Работа начинается с намерения, затем открываются компоненты, пояснения и маршруты. Шаг требует выбранного маршрута, пересечение — двух источников. Сначала меняется C++/CLI, затем веб-проекция. Английский — по умолчанию, украинский и русский — в отдельных конфигурациях. Справка получает постоянную якорную секцию, прокрутка становится свободной.

</details>

<details><summary>Українська</summary>

Кожен намір одразу починає горизонтальну лінію. Кілька намірів і варіантів маршруту видно разом. Початкова картка зберігає ID наміру; окремий дублювальний крок їй не потрібен. Робота починається з наміру, далі відкриваються компоненти, пояснення й маршрути. Крок потребує вибраного маршруту, перетин — двох джерел. Спочатку змінюється C++/CLI, потім веб-проєкція. Англійська — за замовчуванням, українська й російська — в окремих конфігураціях. Довідка має постійну якірну секцію, прокручування стає вільним.

</details>

<details><summary>Беларуская</summary>

Кожны намер адразу пачынае гарызантальную лінію. Некалькі намераў і варыянтаў маршруту бачныя разам. Пачатковая картка захоўвае ID намеру; асобны дублявальны крок ёй не патрэбны. Праца пачынаецца з намеру, пасля адкрываюцца кампаненты, тлумачэнні і маршруты. Крок патрабуе выбранага маршруту, перасячэнне — дзвюх крыніц. Спачатку змяняецца C++/CLI, потым вэб-праекцыя. Англійская — асноўная; украінскі і рускі інтэрфейсы выкарыстоўваюць наяўныя пераклады.

</details>
