import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { TarjanCut } from '../Animate/tarjan_cut/tarjan'

const graphOf = (nodes: number[], edges: Array<[number, number]>, type = GraphType.undigraph) => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

describe('Tarjan cut vertices', () => {
    it('finds cut vertices in a connected graph', () => {
        const algorithm = new TarjanCut()
        algorithm.set_graph(graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 4], [4, 5]]))

        const result = algorithm.run()

        expect(result).toEqual({
            status: 'complete',
            cut_nodes: [2, 3, 4],
            visited: [1, 2, 3, 4, 5],
            start: 1,
        })
        expect(algorithm.get_frame(algorithm.frame_cnt).status).toBe('complete')
    })

    it('visits every disconnected component and supports non-contiguous IDs', () => {
        const algorithm = new TarjanCut()
        algorithm.set_graph(graphOf([10, 20, 30, 40, 50], [[10, 20], [20, 30], [40, 50]]))

        const result = algorithm.run()
        const finalFrame = algorithm.get_frame(algorithm.frame_cnt)

        expect(result).toEqual({
            status: 'complete',
            cut_nodes: [20],
            visited: [10, 20, 30, 40, 50],
            start: 10,
        })
        expect(finalFrame.node_ids).toEqual([10, 20, 30, 40, 50])
        expect(finalFrame.dfn.every((value) => value > 0)).toBe(true)
        expect(finalFrame.low).toHaveLength(5)
    })

    it('accepts an explicit non-minimum start and still covers the whole graph', () => {
        const algorithm = new TarjanCut()
        algorithm.set_graph(graphOf([10, 20, 42], [[10, 20], [10, 42]]))

        const result = algorithm.run(42)

        expect(result.status).toBe('complete')
        expect(result.start).toBe(42)
        expect(result.cut_nodes).toEqual([10])
        expect(result.visited).toEqual([42, 10, 20])
    })

    it('returns structured results for empty, invalid-start, and directed graphs', () => {
        const empty = new TarjanCut()
        expect(empty.run()).toEqual({ status: 'empty', cut_nodes: [], visited: [], start: null })

        const invalidStart = new TarjanCut()
        invalidStart.set_graph(graphOf([10], []))
        expect(invalidStart.run(99)).toEqual({
            status: 'invalid_start',
            cut_nodes: [],
            visited: [],
            start: 99,
            error: '起点 99 不存在',
        })

        const directed = new TarjanCut()
        directed.set_graph(graphOf([1, 2], [[1, 2]], GraphType.digraph))
        expect(directed.run()).toEqual({
            status: 'invalid_graph',
            cut_nodes: [],
            visited: [],
            start: 1,
            error: 'Tarjan 割点算法只支持无向图',
        })
    })
})
