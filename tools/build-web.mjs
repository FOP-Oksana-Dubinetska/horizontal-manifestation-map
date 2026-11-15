import { build } from 'vite';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const introduction = JSON.parse(
	await readFile(resolve(root, 'content/project-introduction.json'), 'utf8'),
);
const hostCopy = JSON.parse(await readFile(resolve(root, 'locales/en.json'), 'utf8')).host;
const escapeHtml = (value) =>
	String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
// Static English help and controls use the same config as the live interface.
const renderHostCopy = (html) =>
	html.replace(
		/<([a-z][a-z0-9]*)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>[^<]*<\/\1\s*>/g,
		(whole, tag, attributes, encodedKey) => {
			const key = encodedKey
				.replaceAll('&quot;', '"')
				.replaceAll('&#39;', "'")
				.replaceAll('&lt;', '<')
				.replaceAll('&gt;', '>')
				.replaceAll('&amp;', '&');
			if (!(key in hostCopy)) throw new Error('Missing English host message: ' + key);
			return `<${tag}${attributes}>${escapeHtml(hostCopy[key])}</${tag}>`;
		},
	);
const renderIntroduction = () => {
	const language = (key, tag, id = '') => {
		const copy = introduction[key];
		return `<${tag}${id ? ` id="${id}"` : ''}>${escapeHtml(copy.title)}</${tag}><p data-introduction-text="${key}">${escapeHtml(copy.text)}</p><p><a href="${escapeHtml(introduction.reviewUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy.link)}</a></p>`;
	};
	return (
		language('en', 'h2', 'introduction-title') +
		'<details lang="ru"><summary>Русский</summary>' +
		language('ru', 'h3') +
		'</details><details lang="uk"><summary>Українська</summary>' +
		language('uk', 'h3') +
		'</details>'
	);
};
const wasmDir = resolve(root, process.env.HMAP_WASM_DIR ?? 'build/wasm-release/engine');
const js = await readFile(resolve(wasmDir, 'roadmap-engine.mjs')),
	wasm = await readFile(resolve(wasmDir, 'roadmap-engine.wasm'));
const hash = createHash('sha256').update(js).update(wasm).digest('hex').slice(0, 20);
const publicDir = resolve(root, 'build/web-public');
await rm(publicDir, { recursive: true, force: true });
await mkdir(resolve(publicDir, 'engine', hash), { recursive: true });
await cp(resolve(root, 'apps/web-demo/public'), publicDir, { recursive: true });
await cp(
	resolve(root, 'examples/architecture-workspace.roadmap.json'),
	resolve(publicDir, 'example.roadmap.json'),
);
await writeFile(resolve(publicDir, 'engine', hash, 'roadmap-engine.mjs'), js);
await writeFile(resolve(publicDir, 'engine', hash, 'roadmap-engine.wasm'), wasm);
let sourceRevision = 'uncommitted',
	sourceDirty = true;
try {
	sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
		cwd: root,
		encoding: 'utf8',
	}).trim();
	sourceDirty = !!execFileSync(
		'git',
		['status', '--porcelain', '--untracked-files=no', '--', '.'],
		{ cwd: root, encoding: 'utf8' },
	).trim();
} catch {}
await writeFile(
	resolve(publicDir, 'version.json'),
	JSON.stringify(
		{
			program: '0.0.0',
			schema: 2,
			api: 1,
			engineBaseUrl: './engine/' + hash + '/',
			sourceRevision,
			sourceDirty,
		},
		null,
		2,
	) + '\n',
);
await mkdir(resolve(publicDir, 'schema'), { recursive: true });
await cp(resolve(root, 'schema'), resolve(publicDir, 'schema'), { recursive: true });
await mkdir(resolve(publicDir, 'licenses'), { recursive: true });
await cp(resolve(root, 'licenses'), resolve(publicDir, 'licenses'), { recursive: true });
await build({
	configFile: false,
	root,
	base: './',
	publicDir: false,
	build: {
		outDir: resolve(root, 'dist/embed'),
		emptyOutDir: true,
		lib: {
			entry: resolve(root, 'packages/roadmap-ui/src/index.ts'),
			formats: ['es'],
			fileName: () => 'hmap-editor.js',
			cssFileName: 'hmap-editor',
		},
		rollupOptions: { output: { assetFileNames: '[name][extname]' } },
	},
});
await build({
	configFile: false,
	root: resolve(root, 'apps/web-demo'),
	plugins: [
		{
			name: 'hmap-static-introduction',
			transformIndexHtml: (html) =>
				renderHostCopy(html).replace('<!-- HMAP_INTRODUCTION -->', renderIntroduction()),
		},
	],
	base: './',
	publicDir,
	build: { outDir: resolve(root, 'dist/site'), emptyOutDir: true },
});
await cp(resolve(root, 'dist/embed'), resolve(root, 'dist/site/embed'), { recursive: true });
await cp(
	resolve(root, 'docs/embedding-example.html'),
	resolve(root, 'dist/site/embedding-example.html'),
);
console.log('Static site: dist/site; embed package: dist/embed; engine:', hash);
