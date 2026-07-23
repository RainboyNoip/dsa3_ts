import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { topsort } from '../Animate/topsort/topsort'

const run = (nodes: number[], edges: Array<[number, number]>) => {
    const graph = new Graph(GraphType.digraph)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))

    const algorithm = new topsort()
    algorithm.set_graph(graph)
    const result = algorithm.run_top_sort()
    return { algorithm, result }
}

describe('topological sort', () => {
    it('sorts a DAG with multiple sources', () => {
        const { algorithm, result } = run(
            [1, 2, 3, 4],
            [[1, 3], [2, 3], [3, 4]],
        )

        expect(result).toEqual({ status: 'complete', order: [1, 2, 3, 4], remaining: [] })
        expect(algorithm.get_frame(algorithm.frame_cnt).status).toBe('complete')
        expect(algorithm.get_frame(algorithm.frame_cnt).top_sort).toEqual([1, 2, 3, 4])
    })

    it('includes isolated vertices in the result', () => {
        const { result } = run([1, 2, 3], [[1, 2]])

        expect(result.status).toBe('complete')
        expect(result.order).toHaveLength(3)
        expect(result.order).toContain(3)
    })

    it('supports non-contiguous node IDs', () => {
        const { result } = run([10, 20, 42], [[10, 42]])

        expect(result).toEqual({ status: 'complete', order: [10, 20, 42], remaining: [] })
    })

    it('reports a cycle instead of returning a silent partial result', () => {
        const { algorithm, result } = run([1, 2], [[1, 2], [2, 1]])
        const frame = algorithm.get_frame(algorithm.frame_cnt)

        expect(result).toEqual({ status: 'cycle', order: [], remaining: [1, 2] })
        expect(frame.status).toBe('cycle')
        expect(frame.nodes_state).toEqual([
            { id: 1, class: ['cycle'] },
            { id: 2, class: ['cycle'] },
        ])
        expect(frame.edges_state).toEqual([
            { source: 1, target: 2, class: ['cycle'] },
            { source: 2, target: 1, class: ['cycle'] },
        ])
    })
})
