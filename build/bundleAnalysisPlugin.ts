import type { OutputChunk } from 'rollup'
import type { Plugin } from 'vite'

type ModuleGroup = {
    bytes: number
    modules: number
}

const groupModule = (moduleId: string): string => {
    const id = moduleId.replaceAll('\\', '/')
    if (id.includes('/node_modules/ace-builds/') || id.includes('/node_modules/vue3-ace-editor/')) {
        return 'Ace editor'
    }
    if (
        id.includes('/node_modules/naive-ui/')
        || id.includes('/node_modules/date-fns')
        || id.includes('/node_modules/lodash')
    ) {
        return 'Naive UI and transitive utilities'
    }
    if (
        id.includes('/node_modules/cytoscape/')
        || id.includes('/node_modules/cytoscape-dagre/')
        || id.includes('/node_modules/dagre/')
        || id.includes('/node_modules/graphlib/')
    ) {
        return 'Cytoscape and layouts'
    }
    if (id.includes('/node_modules/@iconify/')) return 'Iconify'
    if (id.includes('/node_modules/vue/') || id.includes('/node_modules/@vue/')) return 'Vue'
    if (id.includes('virtual:uno') || id.includes('/unocss/')) return 'UnoCSS'
    if (id.includes('/node_modules/')) return 'Other dependencies'
    return 'Project code'
}

const formatKiB = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KiB`

export function bundleAnalysisPlugin(enabled: boolean): Plugin {
    return {
        name: 'bundle-analysis',
        apply: 'build',
        generateBundle(_options, bundle) {
            if (!enabled) return

            const chunks = Object.values(bundle)
                .filter((output): output is OutputChunk => output.type === 'chunk')
                .sort((left, right) => right.code.length - left.code.length)
            const largestChunk = chunks[0]
            if (!largestChunk) return

            const groups = Object.entries(largestChunk.modules).reduce<Map<string, ModuleGroup>>(
                (result, [moduleId, module]) => {
                    const groupName = groupModule(moduleId)
                    const group = result.get(groupName) || { bytes: 0, modules: 0 }
                    group.bytes += module.renderedLength
                    group.modules += 1
                    result.set(groupName, group)
                    return result
                },
                new Map(),
            )
            const totalRenderedBytes = [...groups.values()]
                .reduce((total, group) => total + group.bytes, 0)

            const groupRows = [...groups.entries()]
                .sort(([, left], [, right]) => right.bytes - left.bytes)
                .map(([name, group]) => {
                    const percentage = ((group.bytes / totalRenderedBytes) * 100).toFixed(1)
                    return `| ${name} | ${formatKiB(group.bytes)} | ${percentage}% | ${group.modules} |`
                })
            const report = [
                '',
                '## Largest JavaScript chunk composition',
                '',
                `Chunk: ${largestChunk.fileName} (${formatKiB(largestChunk.code.length)})`,
                '',
                '| Group | Rendered size | Share | Modules |',
                '| --- | ---: | ---: | ---: |',
                ...groupRows,
                '',
            ].join('\n')

            console.log(report)
        },
    }
}
