import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import { Graph, GraphType } from '../lib/graph_ts'
import type { GraphReadResult } from '../lib/graph_ts'

export type ParsedGraphInput =
    | { ok: true; graph: Graph }
    | { ok: false; error: string }

export type GraphInputRules = {
    allowWeights?: boolean
    requireConnected?: boolean
}

export function parseGraphInput(
    input: string,
    graphType: GraphType,
    rules: GraphInputRules = {},
): ParsedGraphInput {
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
