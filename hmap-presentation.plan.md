# HMAP — a learning project with a readable introduction

Stage 19 · 2026-11-14 · additive to the Stage 18 delivery.

## Chunk: `<<project-introduction>>`

The owner's request adds a warmer English README with Russian/Ukrainian disclosures, a concise account of the learning project and its actual toolchain, and a short ideological introduction shared by the website and native terminal. The author has been actively studying C++ since the beginning of 2026.

The source is `content/project-introduction.json`. Its account of readable architecture is informed by the repository README and opening methodological framework of Zhovten-Games/literate-programming, inspected through GitHub at `a02d337c40a8cab56af28cf0ade1611087f9bd52`. HMAP is inspired by the review's human-readable design principle; this does not imply a WEB-compatible tangle/weave implementation.

The website builds the introduction into static HTML immediately before the footer. English is visible; native details elements reveal Russian and Ukrainian translations. The workspace and introduction are separate viewport sections. Ordinary wheel movement stays in a fitted section and scrolls its inner content. A deliberate strong wheel gesture moves to the adjacent section, including the footer. Links, keyboard, touch, horizontal route scrolling, zoom, forms, long expanded content and reduced-motion preferences retain their natural navigation.

A native terminal presents the same English introduction before successful human-readable CLI output. Pipes, redirected files, version output, JSON, Markdown and artifact-producing commands retain their established data formats. Presentation belongs to the CLI adapter; the C++ domain/API and Wasm engine remain independent of the introduction.

Named files: README; current introductory prose in docs; content JSON; CMakeLists; CLI composition root and generated-header template; web host HTML/CSS and section-scrolling module; build-web; CLI terminal integration script; browser section tests; check-project/distribution; CONTRACTS; SCENARIOS; this plan; Stage-19 card/index; TRACE.

Verification: real PTY and existing CLI contracts; browser wheel/keyboard/modal tests in Chromium/Firefox; TypeScript/build/distribution; native/Wasm regression; documentary consistency; one project-relative patch replayed against Stage 18.

<details><summary>Русский</summary>

Учебный контекст, стек и краткое объяснение идеи получают английский основной текст и переводы под спойлерами. Один источник обеспечивает совпадение английского вступления на сайте и в терминале. Фиксация двух секций сохраняет обычное чтение внутри рабочей области; усиленный жест переводит к соседней секции. Технические результаты остаются в TRACE, а текущие руководства освобождаются от повторяющихся формальных оговорок.

</details>

<details><summary>Українська</summary>

Навчальний контекст, стек і коротке пояснення ідеї мають англійський основний текст та переклади під спойлерами. Єдине джерело забезпечує однаковий англійський вступ на сайті й у терміналі. Фіксація двох секцій зберігає звичайне читання всередині робочої області; посилений жест переводить до сусідньої секції. Технічні результати залишаються в TRACE, а поточні посібники звільняються від повторюваних формальних застережень.

</details>
