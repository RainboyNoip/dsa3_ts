import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { fleury } from '../Animate/fleury/fleury'

const graphOf = (nodes: number[], edges: Array<[number, number]>, type = GraphType.undigraph) => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

describe('Fleury Euler trail', () => {
    it('finds an Euler circuit on a non-contiguous graph', () => {
        const algorithm = new fleury()
        algorithm.set_graph(graphOf([10, 20, 30], [[10, 20], [20, 30], [30, 10]]))

        const result = algorithm.run()

        expect(result.status).toBe('complete')
        expect(result.start).toBe(10)
        expect(result.path).toHaveLength(4)
        expect(result.path[0]).toBe(result.path[result.path.length - 1])
        expect(result.edges).toHaveLength(3)
        expect(algorithm.get_frame(algorithm.frame_cnt - 1).status).toBe('complete')
    })

    it('starts at an odd-degree vertex and leaves a bridge until the end', () => {
        const algorithm = new fleury()
        algorithm.set_graph(graphOf([1, 2, 3, 4], [[1, 3], [3, 4], [3, 2], [1, 2]]))

        const result = algorithm.run()

        expect(result.status).toBe('complete')
        expect(result.start).toBe(3)
        expect(result.path).toEqual([3, 1, 2, 3, 4])
        expect(result.edges[result.edges.length - 1]).toEqual([3, 4])
    })

    it('reports too many odd vertices and disconnected non-isolated components', () => {
        const odd = new fleury()
        odd.set_graph(graphOf([1, 2, 3, 4], [[1, 2], [1, 3], [1, 4]]))
        expect(odd.run()).toEqual({
            status: 'no_euler_trail',
            start: 1,
            path: [],
            edges: [],
            error: '图中奇度节点超过 2 个，无欧拉迹',
        })

        const disconnected = new fleury()
        disconnected.set_graph(graphOf([10, 20, 30, 40], [[10, 20], [30, 40]]))
        expect(disconnected.run()).toEqual({
            status: 'no_euler_trail',
            start: 10,
            path: [],
            edges: [],
            error: '图中的非孤立节点不连通，无欧拉迹',
        })
    })

    it('handles empty, isolated, invalid-start, and directed graphs without throwing', () => {
        const empty = new fleury()
        expect(empty.run()).toEqual({ status: 'empty', start: null, path: [], edges: [] })

        const isolated = new fleury()
        isolated.set_graph(graphOf([42], []))
        expect(isolated.run()).toEqual({ status: 'complete', start: 42, path: [42], edges: [] })

        const invalidStart = new fleury()
        invalidStart.set_graph(graphOf([10], []))
        expect(invalidStart.run(99)).toEqual({
            status: 'invalid_start',
            start: 99,
            path: [],
            edges: [],
            error: '起点 99 不存在',
        })

        const directed = new fleury()
        directed.set_graph(graphOf([1, 2], [[1, 2]], GraphType.digraph))
        expect(directed.run()).toEqual({
            status: 'invalid_graph',
            start: null,
            path: [],
            edges: [],
            error: 'Fleury 算法只支持无向图',
        })
    })
})
