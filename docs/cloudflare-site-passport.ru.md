# Паспорт сайта HMAP на Cloudflare Pages

Редакция: 2026-11-11. Состояние: подготовленная конфигурация; проект Pages, DNS и публичный выпуск выполняет владелец. Продукт — статический потребитель общего C++20/WASM-движка. Код карты обрабатывается локально в Worker. Backend, БД, авторизация и API-ключи для работы редактора отсутствуют.

## Идентичность и адрес

| Параметр | Значение |
| --- | --- |
| Название | Horizontal Manifestation Map / Горизонтальная карта проявлений |
| CLI | `hmap` |
| Версии кандидата | программа `0.0.0`, JSON schema `2`, RoadmapText `1`, API `1`, guidance `1.0.0` |
| Предлагаемое имя Pages | `zhovten-hmap`; фактическая доступность имени проверяется при создании |
| Предлагаемый публичный адрес | `https://hmap.zhovten.games/` |
| Рабочий репозиторий | `pan-canon/TheWorldOfCanon`, ветка `main` |
| Рабочая директория | `at-work/horizontal-manifestation-map` |
| Будущий отдельный репозиторий | `FOP-Oksana-Dubinetska/horizontal-manifestation-map`; имя предложено для выделения, репозиторий не создан |
| Владелец публикации | владелец репозитория и зоны `zhovten.games` |

`hmap.zhovten.games` выделяет редактор на отдельный origin. LocalStorage этого origin сохраняет самостоятельное пространство данных. При смене origin карты переносятся скачанными JSON-файлами; автоматического переноса браузерного хранилища между адресами нет.

## Настройка Git integration

Создайте Pages-проект через Workers & Pages → Create application → Pages → Connect to Git. Выберите текущий рабочий репозиторий и выдайте Cloudflare GitHub App доступ к нему. Доступ к приватному рабочему репозиторию должен принадлежать подключённой GitHub installation. Дальше установите параметры:

| Поле Pages | Работа из TheWorldOfCanon | После выделения отдельного репозитория |
| --- | --- | --- |
| Production branch | `main` | `main` |
| Framework preset | None | None |
| Root directory | `at-work/horizontal-manifestation-map` | корень репозитория, поле пустое |
| Build command | `bash tools/cloudflare-build.sh` | `bash tools/cloudflare-build.sh` |
| Build output directory | `dist/site` | `dist/site` |
| Node | `NODE_VERSION=24.22.1` | `NODE_VERSION=24.22.1` |
| Python | Python 3.12, выбранный образом сборки либо явно через его настройку | то же |
| Production URL | назначенный Pages адрес `*.pages.dev` | после переключения нового проекта |

Скрипт сам определяет корень через своё расположение. Изменять исходники для перехода от монорепозитория к отдельному репозиторию не требуется. Установка зависимостей выполняется отдельной явно сетевой частью скрипта: закреплённые CMake/Ninja, emsdk на SHA `5eb0bde7585670252e8ba05e9d361627bffd08b5`, Emscripten `6.0.9`, проверенные C++-исходники и `npm ci`. Затем идут typecheck, storage-тесты, Wasm probe, сборка и проверка поставки. Сбой любого шага возвращает ненулевой код и останавливает публикацию.

Полная native/браузерная приёмка выполняется локальным `python tools/check-project.py --profile all` и CI. Pages отвечает за сборку статических ресурсов проверенной редакции. Секреты Cloudflare API для Git integration не нужны в клиентском коде и в этом скрипте. Автоматическая установка npm образом Pages может предварительно выполнить установку; закреплённый `npm ci` в скрипте остаётся контрольным способом подготовки Node-зависимостей.

## Подключение домена

1. Сначала дождитесь успешного preview на назначенном `*.pages.dev` и проверьте загрузку редактора.
2. В Pages → Custom domains добавьте `hmap.zhovten.games` именно к выбранному Pages-проекту.
3. Если зона `zhovten.games` находится в том же аккаунте Cloudflare, используйте предложенное создание DNS-записи. Для ручной записи: имя `hmap`, тип `CNAME`, цель — фактический `<имя-проекта>.pages.dev`, выданный Pages. Сначала связывается custom domain в Pages, затем настраивается DNS.
4. Проверьте отсутствие конфликтующей A/AAAA/CNAME-записи с тем же именем. Для обслуживаемого поддомена не меняйте apex и MX зоны.
5. Дождитесь статуса домена Active и действующего HTTPS-сертификата. Проверьте адрес без перенаправления на другие приложения.

Значения CNAME, статус домена и сертификат фиксируются после фактического создания. Данный паспорт не выдаёт проектную запись за существующую инфраструктуру.

## Ресурсы, MIME и кэши

Поставка находится в `dist/site`. В неё входят HTML, CSS, ES modules, Worker, JS/Wasm одной сборки, JSON Schema, пример встраивания и лицензии. Каталоги исходных нормативных репозиториев, Git, build-кэши и `node_modules` исключены.

| Ресурс | Ожидаемое поведение |
| --- | --- |
| `/` и `/index.html` | HTML; повторная проверка актуальной версии |
| `/version.json` | актуальный `engineBaseUrl`, source revision и признак dirty; `no-cache` |
| `/engine/<hash>/roadmap-engine.mjs` | JavaScript MIME, immutable cache |
| `/engine/<hash>/roadmap-engine.wasm` | `application/wasm`, immutable cache |
| `/assets/*` | хешированные UI/Worker assets |
| `/embed/hmap-editor.js` и CSS | публичный пакет встраивания, обновляемые имена файлов |
| `/licenses/*` | notices и применимые тексты лицензий |

Хеш папки вычисляется из точных байтов JS и Wasm. Обновляются оба файла вместе. `version.json` указывает на их единый комплект; ручная подмена одного файла нарушает поставку. Service Worker отсутствует. Схема кэширования PWA остаётся отдельным расширением.

Файл `_headers` копируется из `apps/web-demo/public`. Он задаёт MIME Wasm/ES modules, `nosniff`, CSP и правила кэша. В CMake включён `DYNAMIC_EXECUTION=0`: Embind работает без `eval`/`Function()`. Для компиляции WebAssembly применяется CSP-источник `'wasm-unsafe-eval'`. Pthreads, SharedArrayBuffer и COOP/COEP этой сборке не требуются.

## Проверка перед включением домена

```powershell
python tools/check-project.py --profile all
python tools/serve-dist.py --port 4173
```

Проверьте `http://127.0.0.1:4173/` и `http://127.0.0.1:4173/tools/roadmap/`. Второй адрес проверяет переносимость ресурсов под вложенным путём; маршрутизация локального сервера даёт этот alias специально для приёмки. Для размещения под реальным префиксом на другом host скопируйте всю поставку в его каталог и согласуйте `_headers` с этим префиксом.

После публикации проверьте:

- штатное начало работы, один маршрут снизу и литературу сверху;
- import → preview → accept, сохранение → перезагрузка → скачивание JSON;
- один реальный `.wasm` в Network с `application/wasm`, успешные Worker и ES module;
- отсутствие запросов с содержимым карты, внешних LLM API и ключей;
- видимую временную сессию при запрете LocalStorage;
- `/embedding-example.html`, два экземпляра и уничтожение одного без остановки общего движка.

Для MIME можно использовать `curl -I` с фактическими путями из `version.json`. Публичный smoke записывается в TRACE отдельным наблюдением с адресом, Git SHA и версиями браузеров. Локальная HTTP-проверка не заменяет факт публикации в Cloudflare.

## Обновление и восстановление

Сначала выполните приёмку кандидата, затем отправьте его в production branch. При неудачном выпуске используйте Pages rollback на предыдущую успешную поставку. Она должна сохранять собственный комплект JS/Wasm. JSON пользователей остаётся в браузере; скачивание является отдельной резервной копией. Перенос поддомена на новый Pages-проект выполняется после проверки его preview и подключения custom domain к выбранному проекту.

## Источники параметров

Параметры и порядок доменного подключения сверены 2026-11-11 по официальным страницам Cloudflare:

- [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Headers](https://developers.cloudflare.com/pages/configuration/headers/)

Имя проекта, поддомен и будущий repository slug являются локальными проектными defaults. Они сохраняют статус предложенных до настройки владельцем.
