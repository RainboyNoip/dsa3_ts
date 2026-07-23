import { appendFileSync, existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const assetsDirectory = fileURLToPath(new URL('../dist/assets/', import.meta.url))
const largestAssetBudget = 1_260_000
const totalJavaScriptBudget = 1_550_000

if (!existsSync(assetsDirectory)) {
    throw new Error('dist/assets does not exist; run `bun run build` before `bun run size:check`.')
}

const assets = readdirSync(assetsDirectory)
    .filter((file) => file.endsWith('.js'))
    .map((file) => {
        const contents = readFileSync(`${assetsDirectory}/${file}`)
        return {
            file,
            rawBytes: contents.byteLength,
            gzipBytes: gzipSync(contents).byteLength,
        }
    })
    .sort((left, right) => right.rawBytes - left.rawBytes)

if (assets.length === 0) {
    throw new Error('No JavaScript assets found in dist/assets.')
}

const totalRawBytes = assets.reduce((total, asset) => total + asset.rawBytes, 0)
const totalGzipBytes = assets.reduce((total, asset) => total + asset.gzipBytes, 0)
const largestAsset = assets[0]
const formatKiB = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KiB`

const report = [
    '## JavaScript bundle size',
    '',
    '| Asset | Raw | Gzip |',
    '| --- | ---: | ---: |',
    ...assets.map((asset) => `| ${asset.file} | ${formatKiB(asset.rawBytes)} | ${formatKiB(asset.gzipBytes)} |`),
    `| **Total** | **${formatKiB(totalRawBytes)}** | **${formatKiB(totalGzipBytes)}** |`,
    '',
    `Budgets: largest asset <= ${formatKiB(largestAssetBudget)}, total JavaScript <= ${formatKiB(totalJavaScriptBudget)}.`,
    '',
].join('\n')

console.log(report)

const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY
if (stepSummaryPath) appendFileSync(stepSummaryPath, report)

const violations: string[] = []
if (largestAsset.rawBytes > largestAssetBudget) {
    violations.push(`${largestAsset.file} is ${formatKiB(largestAsset.rawBytes)}`)
}
if (totalRawBytes > totalJavaScriptBudget) {
    violations.push(`total JavaScript is ${formatKiB(totalRawBytes)}`)
}

if (violations.length > 0) {
    throw new Error(`Bundle size budget exceeded: ${violations.join('; ')}`)
}
