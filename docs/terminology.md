# Languages and terminology

English is the default. Ukrainian (uk) and Russian (ru) are available through the workspace selector, CLI --lang, API options.language and embedding configuration. An explicit ?lang=en|uk|ru overrides the host’s locally saved preference. This preference is separate from map storage.

locales/en.json, uk.json and ru.json contain interface, host, map, help, diagnostic and terminology strings. docs/guidance/catalog.json retains language-independent topic metadata. CMake embeds locale resources into the common C++ engine; TypeScript reads the same configs. Complete matching key sets are checked in tests/web/locales.test.ts.

The ordinary workspace uses engineering labels. Legacy engineering/simple/product/literary profiles remain available through explicit embedding opt-in and CLI/API guidance. A profile chooses a vocabulary; language chooses its translation. Authored text, machine keys, enum values and IDs retain their meaning. The example section of each locale config supplies the complete built-in architecture sample; its variants preserve IDs and references. A pristine unsaved sample follows language, while an accepted edit, import or explicit save retains its authored text. The source examples/architecture-workspace.roadmap.json is English and can be rendered directly with CLI.

<details><summary>Русский</summary>

Английский — по умолчанию; украинский и русский выбираются в интерфейсе или через --lang=uk|ru. Конфиги locales/*.json содержат переводы интерфейса, справки и диагностики CLI и веба. Профиль задаёт словарь, язык — перевод. Авторский текст и ID сохраняются.

</details>

<details><summary>Українська</summary>

Англійська — за замовчуванням; українська й російська вибираються в інтерфейсі або через --lang=uk|ru. Конфіги locales/*.json містять переклади інтерфейсу, довідки й діагностики CLI та вебу. Профіль задає словник, мова — переклад. Авторський текст та ID зберігаються.

</details>
