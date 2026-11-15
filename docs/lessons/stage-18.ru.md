# Stage 18 — сводная проверка и последовательная поставка

## 1. Что получаем

Документированный авторский выпуск с четырьмя последовательными диффами Stage 15–18, проверкой базы по хешам и пробным применением всей серии в изолированном каталоге.

## 2. Файлы этого диффа

- `AGENTS.md`
- `CHANGELOG.md`
- `PROJECT-ADAPTATION.md`
- `README.md`
- `SCENARIOS.md`
- `TRACE.md`
- `docs/acceptance-matrix.ru.md`
- `docs/browser-diagnostics.ru.md`
- `docs/cloudflare-site-passport.ru.md`
- `docs/embedding.md`
- `docs/lessons/stage-18.ru.md`
- `docs/terminology.md`
- `generated/implementation-candidate.md`
- `packages/roadmap-ui/src/index.ts`
- `packages/roadmap-ui/src/style.css`
- `roadmap-editor.plan.md`
- `tests/browser/editor.spec.ts`
- `tests/browser/workspace.spec.ts`
- `tools/check-distribution.py`
- `tools/check-project.py`

## 3. Контракт

Активный план имеет явный приоритет над историческими viewer-only ограничениями. Схема 2, версии CLI/API, retained author files, immutable method и политики сохраняются. Distribution gate проверяет новый пример, same-origin внешние scripts и отсутствие inline handlers/file:-ссылок в собственном HTML. Указанный в сообщении content.js без полного URL сохраняет статус неподтверждённого внешнего наблюдения.

## 4. Проверка

```powershell
python tools/check-project.py --profile all
```

Профиль использует предварительно подготовленные зависимости и активированный Emscripten; установки, обновления и форматирования в нём отсутствуют. Сводный результат и проверенная ревизия записываются в `build/check-reports/check-project.json` и в отчёт архива. После наблюдаемого прохода TRACE дополняется фактическими результатами. Поставка отдельно проверяет чистое применение, повторный запуск и сохранность файлов при несовпадении базы.

### Наблюдаемый результат

Чистая проверенная ревизия кода: `213d6a5ec57d02562f7b3265c0453948be176496`. All-profile: PASS; tracked-файлы во время проверки сохранены побайтно. Следующее дополнение этой карточки и TRACE содержит только фактические результаты.

| Проверка | Результат |
| --- | --- |
| Native C++ / CTest | 33/33 PASS |
| Реальные CLI-контракты | 40/40 PASS |
| Wasm probe | 1/1 PASS |
| Native/Wasm API parity | 11/11 PASS |
| Storage + authoring candidates | 9/9 PASS |
| Chromium + Firefox | 46/46 PASS |
| TypeScript / production build / distribution | PASS; 28 файлов |
| Governance / PLW candidate validator | PASS |
| Чистое применение в отдельный репозиторий и вложенный каталог | PASS |
| Повторный запуск / префикс серии / отказ при локальном конфликте | PASS |

Версии браузеров: Chromium 145.0.7632.6, Firefox 146.0.1. CMake 3.31.6, Ninja 1.11.1.4, GCC 14.2.0. Поставка содержит соответствующие отчёты; source code после полного прохода не изменялся. Финальный replay проверяет также документальные дополнения по ожидаемому Git tree.

## 5. Передача

В архиве: `README.ru.md`, `series.json`, четыре patch-файла, `apply-series.py`, PowerShell launcher, карточки, руководство, отчёты и контрольные суммы. Сначала выполните `--check-only`, затем примените серию и проверьте исходники. После обычной сборки рабочий репозиторий публикует обновление существующего Pages-сайта. После сборки можно открыть опубликованную страницу и пройти короткий сценарий из руководства.
