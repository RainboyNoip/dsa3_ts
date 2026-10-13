import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import { Graph, GraphType } from '../lib/graph_ts'
import type { GraphReadResult } from '../lib/graph_ts'

export type ParsedGraphInput =
    | { ok: true; graph: Graph }
    | { ok: false; error: string }

export type GraphInputRules = {
    allowWeights?: boolean
    requireConnected?: boolean
    maxNodes?: number
    maxEdges?: number
    maxFrames?: number
    maxRuntimeMs?: number
}

export const DEFAULT_GRAPH_INPUT_LIMITS = {
    maxNodes: 80,
    maxEdges: 200,
    maxFrames: 2000,
    maxRuntimeMs: 1000,
} as const satisfies GraphInputRules

export const FLEURY_GRAPH_INPUT_LIMITS = {
    maxNodes: 30,
    maxEdges: 60,
    maxFrames: 512,
    maxRuntimeMs: 1000,
} as const satisfies GraphInputRules

export const HIERHOLZER_GRAPH_INPUT_LIMITS = {
    maxNodes: 30,
    maxEdges: 60,
    maxFrames: 512,
    maxRuntimeMs: 1000,
} as const satisfies GraphInputRules

export function parseGraphInput(
    input: string,
    graphType: GraphType,
    rules: GraphInputRules = {},
): ParsedGraphInput {
    const sizeError = validateDeclaredSize(input, rules)
    if (sizeError) return { ok: false, error: sizeError }

    const graph = new Graph(graphType)
    const result: GraphReadResult = graph.readFromString(input)
    if (!result.ok) return result

    if (rules.allowWeights === false) {
        const weightedLine = input
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(1)
            .findIndex((line) => line.split(/\s+/).length === 3)
        if (weightedLine !== -1) {
            return { ok: false, error: `第 ${weightedLine + 2} 行不支持边权，当前算法只接受 u v` }
        }
    }

    if (rules.requireConnected && !hasConnectedNonIsolatedNodes(graph)) {
        return { ok: false, error: '非孤立节点不连通，当前算法需要连通图' }
    }

    return { ok: true, graph }
}

function validateDeclaredSize(input: string, rules: GraphInputRules): string | null {
    const header = input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean)
        ?.split(/\s+/)
        .map(Number)

    if (!header || header.length !== 2 || !header.every(Number.isSafeInteger)) return null
    const [nodeCount, edgeCount] = header
    if (rules.maxNodes !== undefined && nodeCount > rules.maxNodes) {
        return `节点数不能超过 ${rules.maxNodes}（当前为 ${nodeCount}）`
    }
    if (rules.maxEdges !== undefined && edgeCount > rules.maxEdges) {
        return `边数不能超过 ${rules.maxEdges}（当前为 ${edgeCount}）`
    }
    if (rules.maxFrames !== undefined) {
        const estimatedFrames = estimateAnimationFrameCount(nodeCount, edgeCount)
        if (estimatedFrames > rules.maxFrames) {
            return `预计动画帧数不能超过 ${rules.maxFrames}（当前估算为 ${estimatedFrames}）`
        }
    }
    return null
}

export function estimateAnimationFrameCount(nodeCount: number, edgeCount: number): number {
    return 1 + nodeCount * 4 + edgeCount * 4
}

export function serializeGraphInput(
    nodes: NodeDefinition[],
    edges: EdgeDefinition[],
    graphType: GraphType,
): string {
    const graph = new Graph(graphType)
    graph.readFromCytoscape(nodes, edges)
    return graph.graph_text_data()
}

function hasConnectedNonIsolatedNodes(graph: Graph): boolean {
    const degrees = graph.getAllDegree()
    const activeNodes = graph.node_ids.filter((nodeId) => degrees[nodeId] > 0)
    if (activeNodes.length <= 1) return true

    const visited = new Set<number>([activeNodes[0]])
    const queue = [activeNodes[0]]
    while (queue.length > 0) {
        const current = queue.shift()
        if (current === undefined) continue
        for (const neighbor of graph.getNeighbors(current)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor)
                queue.push(neighbor)
            }
        }
    }
    return activeNodes.every((nodeId) => visited.has(nodeId))
}
