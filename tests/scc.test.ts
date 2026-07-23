import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { Dfsscc } from '../Animate/dfsscc/dfsscc'

const graphOf = (nodes: number[], edges: Array<[number, number]>, type = GraphType.digraph) => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

const normalizedComponents = (components: number[][]) => components
    .map((component) => [...component].sort((left, right) => left - right))
    .sort((left, right) => left[0] - right[0])

describe('Tarjan strongly connected components', () => {
    it('finds SCCs across non-contiguous node IDs and multiple components', () => {
        const algorithm = new Dfsscc(graphOf(
            [10, 20, 30, 40, 50],
            [[10, 20], [20, 30], [30, 10], [30, 40], [40, 50], [50, 40]],
        ))

        const result = algorithm.run_dfsscc()

        expect(result.status).toBe('complete')
        expect(result.visited).toEqual([10, 20, 30, 40, 50])
        expect(normalizedComponents(result.components)).toEqual([[10, 20, 30], [40, 50]])
        expect(result.component_by_node.get(10)).toBe(result.component_by_node.get(30))
        expect(result.component_by_node.get(40)).toBe(result.component_by_node.get(50))
        expect(result.component_by_node.get(10)).not.toBe(result.component_by_node.get(40))

        const frame = algorithm.get_frame(algorithm.frame_cnt)
        expect(frame.status).toBe('complete')
        expect(frame.node_ids).toEqual([10, 20, 30, 40, 50])
        expect(frame.dfn.every((value) => value > 0)).toBe(true)
        expect(frame.color).toHaveLength(5)
    })

    it('includes isolated vertices as singleton components', () => {
        const algorithm = new Dfsscc(graphOf([7, 11, 42], []))
        const result = algorithm.run_dfsscc()

        expect(result.status).toBe('complete')
        expect(normalizedComponents(result.components)).toEqual([[7], [11], [42]])
    })

    it('returns structured results for empty, invalid-start, and undirected graphs', () => {
        const empty = new Dfsscc(new Graph(GraphType.digraph))
        expect(empty.run_dfsscc()).toEqual({
            status: 'empty',
            start: null,
            visited: [],
            components: [],
            component_by_node: new Map(),
        })

        const invalidStart = new Dfsscc(graphOf([10], []))
        expect(invalidStart.run_dfsscc(99)).toEqual({
            status: 'invalid_start',
            start: 99,
            visited: [],
            components: [],
            component_by_node: new Map(),
            error: '起点 99 不存在',
        })

        const undirected = new Dfsscc(graphOf([1, 2], [[1, 2]], GraphType.undigraph))
        expect(undirected.run_dfsscc()).toEqual({
            status: 'invalid_graph',
            start: 1,
            visited: [],
            components: [],
            component_by_node: new Map(),
            error: '强连通分量算法只支持有向图',
        })
    })
})
