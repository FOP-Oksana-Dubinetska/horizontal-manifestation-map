# HMAP — Horizontal Manifestation Map

HMAP is a learning project in C++: a small workspace for connecting software architecture with a development roadmap. An intention describes a result, components describe the system, and a route links implementation steps to the contracts that explain them. The same C++ model runs in a native CLI and in the browser through WebAssembly.

I have been actively studying C++ since the beginning of **2026**. This project gives that study a practical shape: value ownership, clear interfaces, serialization, validation, build systems and tests all meet in one place. Small, inspectable changes are part of the learning process. The compiler is an attentive conversation partner, although it rarely appreciates a hint.

The idea grew out of an earlier [review of Donald Knuth's *Literate Programming*](https://github.com/Zhovten-Games/literate-programming): explanation and structure should help a human reader understand how a program fits together. HMAP applies that interest to architecture and planning, keeping intentions, reusable components and the reasoning behind a route close to the work itself.

## Explore the map

Create a project and add an intention: its line appears immediately. Add a route on that line, describe components and contracts, then connect them through route steps. Several intentions and alternative routes can be developed together. Names can change while identities and references stay connected. Forms check each change with the shared engine; saving keeps the map in the current browser. JSON carries it to another browser, and Markdown turns it into a readable plan.

The browser opens a two-route architecture example. Existing saved maps are available from the file menu. English is the default interface language, with Ukrainian and Russian available from the language selector. How to work and About this project sit together in the top navigation. The complete initial example follows the selected language until it is edited or saved; saved maps retain their authored text. Help has its own linked section before the project introduction. Page scrolling is free; links, keyboard and touch provide direct navigation. Vertical reading uses compact monospaced `<<…>>` section names. The footer links to the source repository.

Run `hmap` in a terminal to read the same English introduction above the CLI help. Human-readable terminal commands share that introduction; version information, data files and piped output remain convenient to use in scripts.

## Technologies

| Area | Tools and purpose |
| --- | --- |
| Core and native CLI | **C++20**, value-based domain objects, explicit adapters and stable ID references |
| Native compiler and debugger | **GCC / MinGW-w64**, **GDB**; the recorded Linux build uses GCC **14.2.0** |
| WebAssembly compiler | **Emscripten 6.0.9**, using its **LLVM/Clang** toolchain and Embind |
| Browser workspace | **TypeScript 5.9.3**, HTML, CSS, native DOM/forms and a Web Worker |
| Web build | **Vite 7.3.1**, **Node.js 24**, npm with a checked-in lockfile |
| Native build | **CMake 3.25+**, presets and **Ninja**; compile commands are exported for editor tooling |
| C++ data and tests | **nlohmann/json 3.12.0**, **Catch2 3.16.0**, **CTest** |
| Integration tests | **Python 3** for CLI/file/terminal checks; the **Node.js test runner** for storage and authoring operations |
| Browser tests | **Playwright 1.58.2**, **Chromium** and **Firefox**, including keyboard, storage and section scrolling |
| Additional tooling | **Git**, **GitHub Actions**, **clang-format**, **Prettier 3.6.2**, optional **AddressSanitizer / UndefinedBehaviorSanitizer** |
| Static hosting | **Cloudflare Pages**; visitors use the built HTML/CSS/JavaScript/Wasm files |
| Map formats | JSON schema 2, reversible RoadmapText/1 and readable Markdown export |

Dependency versions and source hashes are recorded in `manifest/`. The [development journal](TRACE.md) follows the individual experiments and checks; [stage cards](docs/lessons/completion-index.ru.md) explain the changes in smaller steps.

## Build and try it

From the HMAP project directory, prepare the dependencies once:

```powershell
python tools/prepare-dependencies.py
python tools/prepare-governance.py
npm ci
npx playwright install chromium firefox
```

Build the native application:

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
.\build\native-debug\bin\hmap.exe
```

On Linux, the executable is `./build/native-debug/bin/hmap`. Useful starting points are `hmap help commands`, `hmap template --output draft.roadmap.json` and `hmap render draft.roadmap.json`. Default `render` shows all intention-led lines; `--route=r-id` selects one route. Try `hmap help workflow --lang=uk` or `hmap help intersections --lang=ru`. Locale text lives in `locales/en.json`, `uk.json` and `ru.json`. Use `--output` when writing an artifact, especially in Windows PowerShell 5.1, whose redirection may change its encoding.

Activate **Emscripten 6.0.9** before building the browser engine. With emsdk installed, run `emsdk install 6.0.9`, `emsdk activate 6.0.9`, then load its `emsdk_env.ps1` in PowerShell or `emsdk_env.sh` in Bash. Back in the project directory:

```powershell
cmake --preset wasm-release
cmake --build --preset wasm-release
npm run build
python tools/serve-dist.py --port 4173
```

Open `http://127.0.0.1:4173/`. The static site is built into `dist/site`, and the embedding package into `dist/embed`. The [site setup guide](docs/cloudflare-site-passport.ru.md) covers Cloudflare and custom domains; [embedding notes](docs/embedding.md) explain how another host can reuse the editor.

## Checks and further reading

```powershell
python tools/check-project.py --profile all
```

The check runner also accepts `native`, `wasm` and `web`. It uses already prepared dependencies, writes its results to `build/check-reports`, and checks that verification leaves the tracked sources untouched. A [test map](docs/acceptance-matrix.ru.md) connects features to their checks. The [authoring guide](docs/authoring-guide.ru.md) describes the workspace, and the [browser notes](docs/browser-diagnostics.ru.md) help trace CSP messages.

For a diff delivery, begin with its README and `apply-series.py --check-only`. The patch helper checks the complete sequence against the files before applying it, including projects that have been copied from `TheWorldOfCanon/at-work/horizontal-manifestation-map` into a separate repository.

<details>
<summary>Русский</summary>

## Учебный проект и его идея

HMAP — учебный проект на C++, связывающий архитектуру программы с дорожной картой разработки. Намерение задаёт результат, компоненты описывают систему, а маршрут соединяет шаги реализации с поясняющими контрактами. Одна модель работает в консольном приложении и в браузере через WebAssembly.

С начала **2026 года** я активно изучаю C++. Проект помогает разбирать владение значениями, интерфейсы, сериализацию, проверку связей, сборку и тестирование на содержательном примере. Небольшие изменения, которые можно прочитать и проверить, составляют часть обучения. Компилятор — внимательный собеседник, хотя намёков он обычно не понимает.

Источником вдохновения стал ранний [обзор статьи Дональда Кнута «Литературное программирование»](https://github.com/Zhovten-Games/literate-programming): объяснение и структура помогают человеку понять устройство программы. HMAP переносит этот интерес в архитектурное планирование и сохраняет ход рассуждений рядом с маршрутом работы.

## Работа с картой

Создайте проект и намерение, опишите компоненты и контракты, добавьте маршрут со связанными шагами. Изменение названия сохраняет ID и ссылки. Формы проверяют изменения общим движком; кнопка сохранения оставляет карту в этом браузере. JSON позволяет перенести её, Markdown — прочитать как связный план.

Каждое намерение сразу начинает линию карты; несколько намерений и маршрутов видны вместе. Интерфейс по умолчанию английский, доступны украинский и русский. Справка вынесена в отдельную якорную секцию. Прокрутка свободная, переходы доступны ссылками и с клавиатуры. При запуске `hmap` в терминале тот же английский текст появляется перед справкой.

## Технологии и запуск

Ядро и CLI написаны на **C++20**; native-профиль использует **GCC/MinGW-w64 и GDB**, веб-сборка — **Emscripten 6.0.9 с LLVM/Clang**. Интерфейс написан на **TypeScript, HTML и CSS**, сборка выполняется **Vite, CMake и Ninja**. Для проверок используются **Catch2/CTest, Python, тестовый раннер Node.js и Playwright с Chromium/Firefox**. Дополняют стек **nlohmann/json, Git/GitHub Actions, clang-format, Prettier и санитайзеры**; статический сайт размещается на **Cloudflare Pages**. Точные версии перечислены в таблице выше и `manifest/`.

Команды подготовки, сборки и проверки приведены в основной части README. После активации emsdk веб-сборка создаёт `dist/site`; локальный сервер запускается командой `python tools/serve-dist.py --port 4173`. Путь к Windows CLI — `.\build\native-debug\bin\hmap.exe`, к Linux CLI — `./build/native-debug/bin/hmap`.

[Руководство](docs/authoring-guide.ru.md), [настройка сайта](docs/cloudflare-site-passport.ru.md), [карта проверок](docs/acceptance-matrix.ru.md) и [TRACE](TRACE.md) помогут продолжить работу. При получении диффа начните с инструкции архива и `--check-only`.

</details>

<details>
<summary>Українська</summary>

## Навчальний проєкт і його ідея

HMAP — навчальний проєкт на C++, що пов'язує архітектуру програми з дорожньою картою розроблення. Намір визначає результат, компоненти описують систему, а маршрут поєднує кроки реалізації з пояснювальними контрактами. Та сама модель працює в консольному застосунку та в браузері через WebAssembly.

Від початку **2026 року** я активно вивчаю C++. Проєкт допомагає досліджувати володіння значеннями, інтерфейси, серіалізацію, перевірку зв'язків, збирання та тестування на змістовному прикладі. Невеликі зміни, які можна прочитати й перевірити, є частиною навчання. Компілятор — уважний співрозмовник, хоча натяків зазвичай не розуміє.

Натхненням став ранній [огляд статті Дональда Кнута «Літературне програмування»](https://github.com/Zhovten-Games/literate-programming): пояснення та структура допомагають людині зрозуміти будову програми. HMAP переносить цей інтерес до архітектурного планування й зберігає хід міркувань поряд із маршрутом роботи.

## Робота з картою

Створіть проєкт і намір, опишіть компоненти та контракти, додайте маршрут зі зв'язаними кроками. Зміна назви зберігає ID і посилання. Форми перевіряють зміни спільним рушієм; кнопка збереження залишає карту в цьому браузері. JSON дає змогу перенести її, Markdown — прочитати як зв'язний план.

Кожен намір одразу починає лінію карти; кілька намірів і маршрутів видно разом. Інтерфейс за замовчуванням англійський, доступні українська та російська. Довідка має окрему якірну секцію. Прокручування вільне, переходи доступні посиланнями й із клавіатури. Під час запуску `hmap` у терміналі той самий англійський текст з'являється перед довідкою.

## Технології та запуск

Ядро й CLI написані на **C++20**; native-профіль використовує **GCC/MinGW-w64 і GDB**, веб-збирання — **Emscripten 6.0.9 з LLVM/Clang**. Інтерфейс написаний на **TypeScript, HTML і CSS**, збирання виконують **Vite, CMake та Ninja**. Перевірки використовують **Catch2/CTest, Python, тестовий раннер Node.js і Playwright із Chromium/Firefox**. Стек доповнюють **nlohmann/json, Git/GitHub Actions, clang-format, Prettier та санітайзери**; статичний сайт розміщується на **Cloudflare Pages**. Точні версії наведені в таблиці вище та `manifest/`.

Команди підготовки, збирання й перевірки наведені в основній частині README. Після активації emsdk веб-збирання створює `dist/site`; локальний сервер запускається командою `python tools/serve-dist.py --port 4173`. Шлях до Windows CLI — `.\build\native-debug\bin\hmap.exe`, до Linux CLI — `./build/native-debug/bin/hmap`.

[Посібник](docs/authoring-guide.ru.md), [налаштування сайту](docs/cloudflare-site-passport.ru.md), [карта перевірок](docs/acceptance-matrix.ru.md) та [TRACE](TRACE.md) допоможуть продовжити роботу. Після отримання дифу почніть з інструкції архіву та `--check-only`.

</details>

<details>
<summary>Беларуская</summary>

HMAP — навучальны праект на C++: невялікае працоўнае асяроддзе, якое звязвае архітэктуру праграмнага забеспячэння з планам распрацоўкі. Намер апісвае вынік, кампаненты апісваюць сістэму, а маршрут звязвае крокі рэалізацыі з кантрактамі, што іх тлумачаць. Адна мадэль C++ працуе ў натыўным CLI і ў браўзеры праз WebAssembly.

Я актыўна вывучаю C++ з пачатку **2026 года**. Праект надае гэтаму навучанню практычную форму: валоданне значэннямі, выразныя інтэрфейсы, серыялізацыя, валідацыя, сістэмы зборкі і тэсты сустракаюцца ў адным месцы. Невялікія змены, якія можна праверыць, складаюць частку навучання. Кампілятар — уважлівы суразмоўца, хоць намёкі ён разумее рэдка.

Ідэя вырасла з ранейшага [агляду *Literate Programming* Дональда Кнута](https://github.com/Zhovten-Games/literate-programming): тлумачэнне і структура павінны дапамагаць чалавеку разумець уладкаванне праграмы. HMAP прымяняе гэтую цікавасць да архітэктуры і планавання, захоўваючы намеры, паўторна выкарыстоўваныя кампаненты і абгрунтаванне маршруту побач з самой працай.

## Даследуйце карту

Стварыце праект і дадайце намер: яго лінія з'явіцца адразу. Дадайце маршрут на гэтай лініі, апішыце кампаненты і кантракты, затым звяжыце іх праз крокі маршруту. Можна адначасова распрацоўваць некалькі намераў і альтэрнатыўных маршрутаў. Назвы могуць змяняцца, а ідэнтычнасці і спасылкі захоўваюць сувязь. Формы правяраюць кожную змену агульным рухавіком; захаванне пакідае карту ў бягучым браўзеры. JSON пераносіць яе ў іншы браўзер, а Markdown ператварае ў чытэльны план.

Браўзер адкрывае прыклад архітэктуры з двума маршрутамі. Захаваныя карты даступныя ў файлавым меню. Асноўная мова інтэрфейсу — англійская; у пераключальніку таксама даступныя руская і ўкраінская. Раздзелы пра парадак працы і пра праект размешчаныя разам у верхняй навігацыі. Увесь пачатковы прыклад адпавядае выбранай мове да рэдагавання або захавання; захаваныя карты пакідаюць аўтарскі тэкст. Даведка мае ўласны раздзел са спасылкай перад апісаннем праекта. Пракрутка старонкі вольная; спасылкі, клавіятура і сэнсарнае кіраванне забяспечваюць прамую навігацыю. Вертыкальнае чытанне выкарыстоўвае кароткія монашырынныя назвы раздзелаў `<<…>>`. Унізе ёсць спасылка на рэпазіторый зыходнага кода.

Запусціце `hmap` у тэрмінале, каб прачытаць той самы англійскі ўступ над даведкай CLI. Каманды для чытання ў тэрмінале выкарыстоўваюць гэты агульны ўступ; звесткі пра версію, файлы даных і вывад у канвеер захоўваюць зручнасць для сцэнарыяў.

## Тэхналогіі

| Вобласць | Інструменты і прызначэнне |
| --- | --- |
| Ядро і натыўны CLI | **C++20**, даменныя аб'екты на аснове значэнняў, яўныя адаптары і спасылкі праз устойлівыя ID |
| Натыўны кампілятар і адладчык | **GCC / MinGW-w64**, **GDB**; зафіксаваная зборка Linux выкарыстоўвае GCC **14.2.0** |
| Кампілятар WebAssembly | **Emscripten 6.0.9**, яго інструментарый **LLVM/Clang** і Embind |
| Браўзернае асяроддзе | **TypeScript 5.9.3**, HTML, CSS, натыўныя DOM/формы і Web Worker |
| Вэб-зборка | **Vite 7.3.1**, **Node.js 24**, npm з зафіксаваным lock-файлам |
| Натыўная зборка | **CMake 3.25+**, прэсеты і **Ninja**; каманды кампіляцыі экспартуюцца для рэдактара |
| Даныя і тэсты C++ | **nlohmann/json 3.12.0**, **Catch2 3.16.0**, **CTest** |
| Інтэграцыйныя тэсты | **Python 3** для праверак CLI, файлаў і тэрмінала; **Node.js test runner** для сховішча і рэдагавання |
| Браўзерныя тэсты | **Playwright 1.58.2**, **Chromium** і **Firefox**, у тым ліку клавіятура, сховішча і пракрутка раздзелаў |
| Дадатковыя інструменты | **Git**, **GitHub Actions**, **clang-format**, **Prettier 3.6.2**, неабавязковыя **AddressSanitizer / UndefinedBehaviorSanitizer** |
| Статычны хостынг | **Cloudflare Pages**; наведвальнікі выкарыстоўваюць сабраныя файлы HTML/CSS/JavaScript/Wasm |
| Фарматы карты | JSON schema 2, зваротны RoadmapText/1 і чытэльны экспарт Markdown |

Версіі залежнасцяў і хэшы зыходнікаў зафіксаваныя ў `manifest/`. [Журнал распрацоўкі](TRACE.md) паказвае асобныя эксперыменты і праверкі; [карткі этапаў](docs/lessons/completion-index.ru.md) тлумачаць змены меншымі крокамі.

## Зборка і запуск

У каталогу праекта HMAP адзін раз падрыхтуйце залежнасці:

```powershell
python tools/prepare-dependencies.py
python tools/prepare-governance.py
npm ci
npx playwright install chromium firefox
```

Збярыце натыўную праграму:

```powershell
cmake --preset native-debug
cmake --build --preset native-debug
ctest --preset native-debug --output-on-failure
.\build\native-debug\bin\hmap.exe
```

У Linux выканальны файл — `./build/native-debug/bin/hmap`. Пачаць можна з `hmap help commands`, `hmap template --output draft.roadmap.json` і `hmap render draft.roadmap.json`. Звычайны `render` паказвае ўсе лініі намераў; `--route=r-id` выбірае адзін маршрут. Паспрабуйце `hmap help workflow --lang=uk` або `hmap help intersections --lang=ru`. Тэксты інтэрфейсу захоўваюцца ў `locales/en.json`, `uk.json` і `ru.json`. Для запісу артэфакта выкарыстоўвайце `--output`, асабліва ў Windows PowerShell 5.1, дзе перанакіраванне можа змяніць кадаванне.

Перад зборкай браўзернага рухавіка актывуйце **Emscripten 6.0.9**. Калі emsdk усталяваны, выканайце `emsdk install 6.0.9`, `emsdk activate 6.0.9`, затым загрузіце яго `emsdk_env.ps1` у PowerShell або `emsdk_env.sh` у Bash. Вярніцеся ў каталог праекта:

```powershell
cmake --preset wasm-release
cmake --build --preset wasm-release
npm run build
python tools/serve-dist.py --port 4173
```

Адкрыйце `http://127.0.0.1:4173/`. Статычны сайт збіраецца ў `dist/site`, пакет для ўбудавання — у `dist/embed`. [Інструкцыя наладжвання сайта](docs/cloudflare-site-passport.ru.md) апісвае Cloudflare і ўласныя дамены; [нататкі пра ўбудаванне](docs/embedding.md) тлумачаць паўторнае выкарыстанне рэдактара іншым хостам.

## Праверкі і дадатковыя матэрыялы

```powershell
python tools/check-project.py --profile all
```

Праграма праверак таксама прымае `native`, `wasm` і `web`. Яна выкарыстоўвае ўжо падрыхтаваныя залежнасці, запісвае вынікі ў `build/check-reports` і правярае, што кантроль пакідае адсочваныя зыходнікі нязменнымі. [Карта тэстаў](docs/acceptance-matrix.ru.md) звязвае магчымасці з праверкамі. [Кіраўніцтва па рэдагаванні](docs/authoring-guide.ru.md) апісвае працоўнае асяроддзе, а [браўзерныя нататкі](docs/browser-diagnostics.ru.md) дапамагаюць разабрацца з паведамленнямі CSP.

Для пастаўкі ў выглядзе diff пачынайце з яе README і `apply-series.py --check-only`. Дапаможная праграма правярае ўсю паслядоўнасць па файлах перад прымяненнем, у тым ліку для праектаў, скапіяваных з `TheWorldOfCanon/at-work/horizontal-manifestation-map` у асобны рэпазіторый.

</details>
