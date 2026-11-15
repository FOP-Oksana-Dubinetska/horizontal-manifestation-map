# Stage 22 · Languages and comfortable navigation

Goal: an English default, complete Ukrainian/Russian interfaces, permanent anchor help and free page scrolling. Input: an accepted map, language and navigation. Output: translated labels/help/diagnostics with the same authored project and selected line.

Files: locale configs, UI translator/editor/forms, web host, build/distribution checks, CLI composition root, locale/section tests and current guides. The wheel-interception module is removed. Each horizontal line retains its own overflow; modal forms retain native focus and scroll handling.

`setLanguage` preserves project/view and emits no change notification. It returns false while a form or import review is open, protecting its draft until closure. The host saves the preference separately from maps. `--lang=uk|ru` selects CLI help, map labels and diagnostics; the ideological terminal introduction remains English.

Checks cover matching locale keys, default/URL/preference language, unsaved-source/view preservation, independent embedded editors, protected drafts, Ukrainian forms/C++ diagnostics, anchor help, ordinary wheel escape, keyboard/touch and narrow layouts. Full-profile results and patch replay are recorded in TRACE.md.

Observed result: all-profile PASS on 1b4e2d59312faf05231a38063e3977e2941e66e7, with unchanged tracked sources. CTest 35, CLI 40 + terminal 12 + workflow/locales 21, Wasm probe 1 + parity 23, node 12 and browsers 72 all passed. The distribution and governance checks passed. Desktop/narrow inspection confirmed the intention origin fits; the default upper area uses 35%, with an adjustable separator and a 180px map minimum. Ordered-patch replay results are included in the delivery.

<details><summary>Русский</summary>

Три конфигурации локалей обслуживают интерфейс, справку и диагностику CLI/веба. Английский — по умолчанию. Смена языка сохраняет карту и выбранную линию; открытая форма защищает черновик до закрытия. Справка вынесена в постоянную якорную секцию, прокрутка страницы свободная.

</details>

<details><summary>Українська</summary>

Три конфігурації локалей обслуговують інтерфейс, довідку й діагностику CLI/вебу. Англійська — за замовчуванням. Зміна мови зберігає карту й вибрану лінію; відкрита форма захищає чернетку до закриття. Довідка має постійну якірну секцію, прокручування сторінки вільне.

</details>
