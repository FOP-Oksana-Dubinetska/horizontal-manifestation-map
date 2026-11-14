import { defineConfig } from '@playwright/test';
export default defineConfig({
	testDir: 'tests/browser',
	timeout: 30000,
	fullyParallel: false,
	workers: 1,
	reporter: 'list',
	use: { baseURL: 'http://127.0.0.1:4173' },
	projects: [
		{
			name: 'chromium',
			use: {
				browserName: 'chromium',
				launchOptions: { executablePath: process.env.HMAP_CHROMIUM_PATH, args: ['--no-sandbox'] },
			},
		},
		{ name: 'firefox', use: { browserName: 'firefox' } },
	],
	webServer: {
		command: 'python3 tools/serve-dist.py --port 4173',
		url: 'http://127.0.0.1:4173',
		reuseExistingServer: false,
	},
});
