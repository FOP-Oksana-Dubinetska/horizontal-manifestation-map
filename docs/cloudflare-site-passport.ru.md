# HMAP — Cloudflare Pages setup

The site serves the same C++ model as the CLI, compiled to WebAssembly and run locally in a Web Worker. This guide collects the build and domain settings in one place, so the next deployment can be a fairly ordinary event.

## Repository and build

| Setting | Monorepository | Standalone repository |
| --- | --- | --- |
| Repository | `pan-canon/TheWorldOfCanon` | `FOP-Oksana-Dubinetska/horizontal-manifestation-map` |
| Production branch | `main` | `main` |
| Root directory | `at-work/horizontal-manifestation-map` | repository root; leave the field empty |
| Framework preset | None | None |
| Build command | `bash tools/cloudflare-build.sh` | `bash tools/cloudflare-build.sh` |
| Output directory | `dist/site` | `dist/site` |
| Node version | `NODE_VERSION=24.22.1` | `NODE_VERSION=24.22.1` |
| Python | Python 3.12 in the build environment | the same |

Connect the repository through the Pages Git integration and select these values. For an existing Pages project, keep its current repository access and update the source through the usual branch. The build script locates the project from its own path, prepares the pinned tools and dependencies, runs its checks and builds the static files.

The public Pages address used for this project is `https://zhovten-hmap.pages.dev/`. A custom subdomain such as `hmap.zhovten.games` can point to the same Pages project. The exact target is the address shown in that project's dashboard.

## Custom domain

1. Open the successful Pages deployment and check that the workspace loads.
2. Add the chosen hostname in Pages → Custom domains.
3. For a subdomain, follow the suggested DNS record, or use a CNAME whose target is the project's actual pages.dev address.
4. Remove any conflicting record for that hostname, leaving unrelated zone and mail records in place.
5. Once the domain and HTTPS certificate are active, open the site at its new address.

Maps belong to their browser origin. To move from pages.dev to a custom domain, download JSON on the old address and import it on the new one.

## Static resources

| Resource | Purpose |
| --- | --- |
| `index.html` | workspace and the statically rendered introduction |
| `version.json` | current engine path and source revision |
| `engine/<hash>/roadmap-engine.mjs` | engine JavaScript module |
| `engine/<hash>/roadmap-engine.wasm` | WebAssembly with `application/wasm` MIME |
| `assets/*` | bundled workspace and Worker assets |
| `example.roadmap.json` | the architecture example |
| `embed/hmap-editor.js` and CSS | public embedding package |
| `licenses/*` | dependency notices and license texts |

The engine directory hash covers both JavaScript and Wasm, and `version.json` points to their matching pair. The `_headers` file supplies MIME, caching and CSP settings. Emscripten's `DYNAMIC_EXECUTION=0` and the CSP source `'wasm-unsafe-eval'` allow this build to run with external scripts. Source trees and dependency caches stay outside the static distribution.

## Try the build

```powershell
python tools/check-project.py --profile all
python tools/serve-dist.py --port 4173
```

Open `http://127.0.0.1:4173/`. The local `/tools/roadmap/` alias also checks that the assets work below a path prefix. A short walkthrough covers the useful parts: create or edit a map, save and reload it, download JSON/Markdown, and move to the introduction before the footer.

The introduction is English first, with Russian and Ukrainian disclosure blocks. Its source, `content/project-introduction.json`, also provides the native CLI's English terminal header. Ordinary wheel movement reads the current section; a stronger gesture moves between sections. Keyboard links and touch provide direct navigation.

After deployment, repeat that short walkthrough at the public address. The Network panel can confirm the Wasm MIME and Worker load. Browser messages that mention `content.js` can be traced with the [browser notes](browser-diagnostics.ru.md).

## Update and recovery

Push the checked source to the production branch. If a deployment needs to be reversed, Pages rollback can restore the previous matching JavaScript/Wasm build. Saved maps remain in the browser; downloaded JSON offers a portable copy.

Official configuration references: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/) and [headers](https://developers.cloudflare.com/pages/configuration/headers/).

<details><summary><strong>Русский</strong></summary>

## Настройка сайта

Для отдельного репозитория выберите ветку `main`, пустое поле Root directory, команду `bash tools/cloudflare-build.sh` и output `dist/site`. В монорепозитории корнем служит `at-work/horizontal-manifestation-map`. Переменная Node — `NODE_VERSION=24.22.1`; сборке также нужны Python и закреплённый Emscripten, которые подготавливает скрипт.

В существующем Pages-проекте можно сохранить текущую Git integration. Собственный домен подключается через Custom domains; CNAME поддомена указывает на фактический pages.dev-адрес этого проекта. При смене адреса карты переносятся через скачивание и импорт JSON, поскольку браузерное хранилище связано с origin.

После сборки откройте карту, измените текст, сохраните и перезагрузите страницу, скачайте JSON/Markdown. Проверьте переход к вступлению перед футером и раскрытие переводов. При необходимости предыдущую сборку можно вернуть через Pages rollback.

</details>

<details><summary><strong>Українська</strong></summary>

## Налаштування сайту

Для окремого репозиторію виберіть гілку `main`, порожнє поле Root directory, команду `bash tools/cloudflare-build.sh` та output `dist/site`. У монорепозиторії коренем є `at-work/horizontal-manifestation-map`. Змінна Node — `NODE_VERSION=24.22.1`; збиранню також потрібні Python і закріплений Emscripten, які готує скрипт.

В існуючому Pages-проєкті можна зберегти поточну Git integration. Власний домен підключається через Custom domains; CNAME піддомену вказує на фактичну pages.dev-адресу цього проєкту. Після зміни адреси карти переносяться через завантаження та імпорт JSON, оскільки браузерне сховище пов'язане з origin.

Після збирання відкрийте карту, змініть текст, збережіть і перезавантажте сторінку, завантажте JSON/Markdown. Перевірте перехід до вступу перед футером і розкриття перекладів. За потреби попереднє збирання можна повернути через Pages rollback.

</details>
