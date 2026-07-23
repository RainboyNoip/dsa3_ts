import { expect, test, type Page } from '@playwright/test'

const algorithmPaths = [
    '/Animate/bfs/',
    '/Animate/dfs/',
    '/Animate/bfs_shortest_path/',
    '/Animate/topsort/',
    '/Animate/dfsscc/',
    '/Animate/tarjan_cut/',
    '/Animate/fleury/',
]

type Diagnostics = {
    consoleErrors: string[]
    pageErrors: string[]
    failedRequests: string[]
    httpErrors: string[]
}

const observeDiagnostics = (page: Page): Diagnostics => {
    const diagnostics: Diagnostics = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        httpErrors: [],
    }
    page.on('console', (message) => {
        if (message.type() === 'error') diagnostics.consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message))
    page.on('requestfailed', (request) => {
        diagnostics.failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText || 'failed'}`)
    })
    page.on('response', (response) => {
        if (response.status() >= 400) diagnostics.httpErrors.push(`${response.status()} ${response.url()}`)
    })
    return diagnostics
}

const expectNoDiagnostics = (diagnostics: Diagnostics): void => {
    expect(diagnostics.consoleErrors).toEqual([])
    expect(diagnostics.pageErrors).toEqual([])
    expect(diagnostics.failedRequests).toEqual([])
    expect(diagnostics.httpErrors).toEqual([])
}

const expectNoHorizontalOverflow = async (page: Page): Promise<void> => {
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)
}

test.describe('homepage', () => {
    test('renders all algorithm links with a light-only, overflow-free layout', async ({ page }) => {
        const diagnostics = observeDiagnostics(page)
        await page.goto('/')
        await page.locator('.algorithm-card').first().waitFor()

        await expect(page.locator('.algorithm-card')).toHaveCount(7)
        await expect(page.locator('.library-status')).toContainText('7 个演示')
        await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light')
        await expectNoHorizontalOverflow(page)

        const hrefs = await page.locator('.algorithm-card').evaluateAll((cards) => cards.map((card) => (
            (card as HTMLAnchorElement).pathname.replace(/index\.html$/, '')
        )))
        expect(new Set(hrefs)).toEqual(new Set(algorithmPaths))
        expectNoDiagnostics(diagnostics)
    })

    test('matches desktop and mobile visual baselines with accessible headings and links', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/')
        await expect(page.getByRole('heading', { name: '算法可视化实验室' })).toBeVisible()
        await expect(page.getByRole('link', { name: /打开.*演示/ })).toHaveCount(7)
        await expect(page).toHaveScreenshot('homepage-desktop.png', {
            animations: 'disabled',
            caret: 'hide',
            fullPage: true,
        })

        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto('/')
        await expectNoHorizontalOverflow(page)
        await expect(page).toHaveScreenshot('homepage-mobile.png', {
            animations: 'disabled',
            caret: 'hide',
            fullPage: true,
        })
    })
})

test.describe('animation pages', () => {
    test('loads the mobile code editor only after opening the code tab', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        const editorRequests: string[] = []
        page.on('request', (request) => {
            const url = new URL(request.url())
            if (url.pathname.endsWith('/src/components/code-editor.vue') && url.search === '') {
                editorRequests.push(request.url())
            }
        })

        await page.goto('/Animate/bfs/')
        await page.locator('.workspace-tabs').waitFor()
        expect(editorRequests).toEqual([])

        await page.getByRole('tab', { name: '代码' }).click()
        await expect(page.locator('.ace_editor')).toBeVisible()
        expect(editorRequests).toHaveLength(1)
    })

    test('shows algorithm limits and blocks oversized graph input', async ({ page }) => {
        await page.goto('/Animate/fleury/')
        await page.getByRole('button', { name: '输入数据' }).click()

        await expect(page.getByText(/当前最多支持 30 个节点、60 条边/)).toBeVisible()
        await page.getByLabel('图数据文本').fill('31 0')
        await expect(page.getByText('节点数不能超过 30（当前为 31）')).toBeVisible()
        await expect(page.getByRole('button', { name: '应用数据' })).toBeDisabled()

        await page.getByRole('button', { name: '恢复样例' }).click()
        await expect(page.getByRole('button', { name: '应用数据' })).toBeEnabled()
    })

    test('offloads large graph animation generation to a Web Worker', async ({ page }) => {
        const diagnostics = observeDiagnostics(page)
        const workerUrls: string[] = []
        page.on('worker', (worker) => workerUrls.push(worker.url()))
        await page.goto('/Animate/bfs/')
        await page.getByRole('button', { name: '输入数据' }).click()

        const edges = Array.from({ length: 23 }, (_, index) => `${index + 1} ${index + 2}`)
        await page.getByLabel('图数据文本').fill(['24 23', ...edges].join('\n'))
        await page.getByRole('button', { name: '应用数据' }).click()

        await expect(page.getByRole('button', { name: '下一帧' })).toBeEnabled()
        expect(workerUrls.some((url) => url.includes('algorithmWorker'))).toBe(true)
        expectNoDiagnostics(diagnostics)
    })

    test('supports desktop playback controls on every algorithm page', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })

        for (const path of algorithmPaths) {
            const diagnostics = observeDiagnostics(page)
            await page.goto(path)
            await page.locator('.workspace-header').waitFor()
            await expect(page.locator('#cy')).toBeVisible()
            await expect(page.getByRole('button', { name: '上一帧' })).toBeDisabled()
            await expect(page.getByRole('button', { name: '下一帧' })).toBeEnabled()
            await expect(page.getByRole('button', { name: '重新开始' })).toBeEnabled()
            await expect(page.locator('.workspace-resizer')).toBeVisible()
            await expectNoHorizontalOverflow(page)

            for (const label of ['返回首页', '上一帧', '播放', '下一帧', '重新开始', '确认跳转', '重新布局']) {
                await expect(page.getByRole('button', { name: label }).locator('svg')).toBeVisible()
            }

            const next = page.getByRole('button', { name: '下一帧' })
            const previous = page.getByRole('button', { name: '上一帧' })

            if (path === '/Animate/bfs/') {
                const dataSelect = page.getByLabel('选择图数据')
                await dataSelect.selectOption({ label: '数据2' })
                await expect(dataSelect).toHaveValue('1')
                await expect(previous).toBeDisabled()
            }

            await next.click()
            await expect(previous).toBeEnabled()
            await page.getByRole('button', { name: '重新开始' }).click()
            await expect(previous).toBeDisabled()

            let playedFrames = 0
            while (await next.isEnabled() && playedFrames < 200) {
                await next.click()
                playedFrames += 1
            }
            expect(playedFrames).toBeGreaterThan(0)
            await expect(next).toBeDisabled()
            expectNoDiagnostics(diagnostics)
        }
    })

    test('supports mobile tabs and stays overflow-free on every algorithm page', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })

        for (const path of algorithmPaths) {
            const diagnostics = observeDiagnostics(page)
            await page.goto(path)
            await page.locator('.workspace-tabs').waitFor()
            await expect(page.getByRole('tablist')).toBeVisible()
            await expect(page.getByRole('tab', { name: '图' })).toHaveAttribute('aria-selected', 'true')

            await page.getByRole('tab', { name: '代码' }).click()
            await expect(page.getByRole('tab', { name: '代码' })).toHaveAttribute('aria-selected', 'true')
            await expect(page.locator('#workspace-panel-code')).toBeVisible()
            await expect(page.locator('#workspace-panel-graph')).toBeHidden()
            await expectNoHorizontalOverflow(page)
            expectNoDiagnostics(diagnostics)
        }
    })
})
