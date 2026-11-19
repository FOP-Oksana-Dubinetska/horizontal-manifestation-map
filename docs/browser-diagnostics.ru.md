# Reading browser messages

HMAP loads external same-origin modules and runs the C++/WebAssembly engine in a Worker. Its CSP allows that engine through `script-src 'self' 'wasm-unsafe-eval'`. A console message is most useful when it includes the full source URL and the action that produced it.

## Find the source

If the console mentions `content.js`, open the source link and inspect its full URL. The filename alone can belong to many different scripts. A `moz-extension://` or `chrome-extension://` origin identifies an extension. Comparing the page in a clean browser profile can help separate extension behaviour from the application's own code.

A `file:///` message points to a local address. Check the requesting element or initiator. HMAP code references are displayed as text, and the local preview runs through HTTP at `127.0.0.1`; opening the built index directly as a local file follows a different browser security model.

## Read the policy in context

A hash suggested by the console identifies a particular inline block. Match it to its source before choosing how it should be loaded. HMAP's own static scripts use external modules; the build checks HTML for inline handlers and local-file links, and the browser scenarios exercise the page under its normal headers.

The [MDN script-src reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src) explains the directive and the distinction between WebAssembly permission and inline JavaScript.

<details><summary>Русский</summary>

Сообщение консоли легче разобрать по полному URL источника и действию, которое его вызвало. Имя `content.js` само по себе не определяет скрипт; origin `moz-extension://` или `chrome-extension://` указывает на расширение. Сравнение с чистым профилем помогает понять происхождение сообщения.

Для `file:///` найдите запрашивающий элемент или инициатор. Локальный просмотр HMAP работает через HTTP-сервер, а ссылки на код показываются текстом. Хеш, предложенный консолью, относится к конкретному inline-блоку; сначала полезно установить, откуда он появился. Встроенные проверки охватывают собственные HTML, модули и обычные заголовки приложения.

</details>

<details><summary>Українська</summary>

Повідомлення консолі легше розібрати за повним URL джерела та дією, яка його спричинила. Назва `content.js` сама собою не визначає скрипт; origin `moz-extension://` або `chrome-extension://` указує на розширення. Порівняння з чистим профілем допомагає з'ясувати походження повідомлення.

Для `file:///` знайдіть елемент або ініціатор запиту. Локальний перегляд HMAP працює через HTTP-сервер, а посилання на код відображаються текстом. Хеш, запропонований консоллю, стосується конкретного inline-блоку; спочатку корисно з'ясувати, звідки він з'явився. Вбудовані перевірки охоплюють власні HTML, модулі та звичайні заголовки застосунку.

</details>
