import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import { Graph, GraphType } from '../lib/graph_ts'
import type { GraphReadResult } from '../lib/graph_ts'

export type ParsedGraphInput =
    | { ok: true; graph: Graph }
    | { ok: false; error: string }

export function parseGraphInput(input: string, graphType: GraphType): ParsedGraphInput {
    const graph = new Graph(graphType)
    const result: GraphReadResult = graph.readFromString(input)
    return result.ok ? { ok: true, graph } : result
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
