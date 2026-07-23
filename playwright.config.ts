import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH
    || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)

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
            ...(chromiumPath ? { executablePath: chromiumPath } : {}),
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
