# Stage 19 — a learning project and a readable introduction

> Stage 22 updates section navigation: native page scrolling and permanent anchor help replace the earlier wheel threshold.

## 1. What this step adds

A concise explanation connects the architecture map to its literate-programming inspiration. English leads the README and website, with Russian and Ukrainian disclosure blocks. The same English introduction welcomes a human terminal session. Current guides use a lighter tone while the development journal keeps its technical record.

## 2. Files

- `AGENTS.md`
- `CMakeLists.txt`
- `CONTRACTS.md`
- `README.md`
- `SCENARIOS.md`
- `TRACE.md`
- `apps/roadmap-cli/composition-root.cpp`
- `apps/roadmap-cli/project-introduction.hpp.in`
- `apps/web-demo/index.html`
- `apps/web-demo/main.ts`
- `apps/web-demo/section-scroll.ts`
- `apps/web-demo/style.css`
- `content/project-introduction.json`
- `docs/acceptance-matrix.ru.md`
- `docs/authoring-guide.ru.md`
- `docs/browser-diagnostics.ru.md`
- `docs/cloudflare-site-passport.ru.md`
- `docs/embedding.md`
- `docs/lessons/completion-index.ru.md`
- `docs/lessons/stage-02-3a.ru.md`
- `docs/lessons/stage-02-3b.ru.md`
- `docs/lessons/stage-03.ru.md`
- `docs/lessons/stage-04.ru.md`
- `docs/lessons/stage-05.ru.md`
- `docs/lessons/stage-06.ru.md`
- `docs/lessons/stage-07.ru.md`
- `docs/lessons/stage-08.ru.md`
- `docs/lessons/stage-09.ru.md`
- `docs/lessons/stage-10.ru.md`
- `docs/lessons/stage-11.ru.md`
- `docs/lessons/stage-12.ru.md`
- `docs/lessons/stage-13.ru.md`
- `docs/lessons/stage-15.ru.md`
- `docs/lessons/stage-18.ru.md`
- `docs/lessons/stage-19.md`
- `hmap-presentation.plan.md`
- `tests/browser/sections.spec.ts`
- `tools/build-web.mjs`
- `tools/check-distribution.py`
- `tools/check-project.py`
- `tools/test-cli-introduction.py`

## 3. Contract

One content source provides static HTML and the native English terminal header. The human terminal presentation leaves data files, JSON/Markdown, version output and pipes in their established formats. Source/model validation remains in the shared engine.

The workspace and the short introduction each stop ordinary wheel scrolling. Inner content continues to scroll; a more decisive gesture moves to an adjacent section. Links, keyboard, touch, zoom and native forms keep their usual navigation. Expanded content that exceeds the viewport remains readable through normal page scrolling.

## 4. Try and check

```powershell
python tools/check-project.py --profile all
.\build\native-debug\bin\hmap.exe
```

Open the built website, move from the workspace to the introduction, reveal each translation, and return through the section link. The terminal introduction uses the same English text. Detailed results are recorded in TRACE and the delivery reports.

### Observed checks

The complete profile passed at clean code revision `653d69b47314cc9caff8fb84af2680ddb3228f6d`, with tracked sources unchanged during verification.

| Check | Result |
| --- | --- |
| Native C++ / CTest | 33/33 PASS |
| Existing CLI contracts | 40/40 PASS |
| Terminal introduction and streams | 12/12 PASS |
| Native/Wasm parity | 11/11 PASS |
| Storage and authoring operations | 9/9 PASS |
| Chromium and Firefox | 56/56 PASS |
| Static content/build/distribution | PASS; 28 files |
| Method/reference checks | PASS |
| Single-patch replay, both repository layouts | PASS |
| Repeated application and local-conflict preservation | PASS |

The final evidence additions affect only this card, TRACE and stage-index formatting. The delivery manifest records that small documentary difference separately from the tested code.

## 5. Apply the step

This is one patch above the Stage 18 delivery. Begin with the archive's `--check-only` command, apply the patch and rebuild. Its helper checks both a standalone repository and the nested project layout.

<details><summary><strong>Русский</strong></summary>

Этап добавляет учебный контекст и стек в README, короткий идейный текст перед футером и то же английское вступление в терминале. Основной текст английский; русский и украинский раскрываются ниже. Обычная прокрутка читает текущую секцию, усиленный жест переходит к соседней. Формы, клавиатура и длинные раскрытые переводы остаются удобными для чтения и работы.

Это один дополнительный дифф после Stage 18. Сначала проверьте его через `--check-only`, затем примените и пересоберите проект. Фактические проверки перечислены в TRACE и отчётах поставки.

</details>

<details><summary><strong>Українська</strong></summary>

Етап додає навчальний контекст і стек до README, короткий ідейний текст перед футером та той самий англійський вступ у терміналі. Основний текст англійський; російський і український розкриваються нижче. Звичайне прокручування читає поточну секцію, посилений жест переходить до сусідньої. Форми, клавіатура та довгі розкриті переклади залишаються зручними для читання й роботи.

Це один додатковий диф після Stage 18. Спочатку перевірте його через `--check-only`, потім застосуйте й перебудуйте проєкт. Фактичні перевірки наведені в TRACE та звітах поставки.

</details>
