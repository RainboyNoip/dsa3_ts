import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    use: {
        baseURL: 'http://127.0.0.1:4173',
        browserName: 'chromium',
        launchOptions: {
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || '/usr/bin/chromium',
            args: ['--no-sandbox'],
        },
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'bun run dev -- --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
        timeout: 120_000,
    },
})
