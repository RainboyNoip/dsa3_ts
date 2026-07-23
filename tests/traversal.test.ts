import { describe, expect, it } from 'vitest'
import { Graph, GraphType } from '../src/lib/graph_ts'
import { BFS } from '../Animate/bfs/bfs'
import { BFS_SP } from '../Animate/bfs_shortest_path/bfs_sp'
import { DFS } from '../Animate/dfs/dfs'

const graphOf = (type: GraphType, nodes: number[], edges: Array<[number, number]>) => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

describe('BFS', () => {
    it('uses the first real node as the default start and visits only its component', () => {
        const bfs = new BFS()
        bfs.set_graph(graphOf(GraphType.undigraph, [10, 20, 42], [[10, 20]]))

        const result = bfs.run_bfs()

        expect(result).toEqual({ status: 'complete', start: 10, order: [10, 20] })
        expect(bfs.get_frame(bfs.frame_cnt).visited).toEqual([10, 20])
    })

    it('returns a structured result for an invalid start', () => {
        const bfs = new BFS()
        bfs.set_graph(graphOf(GraphType.undigraph, [1], []))

        expect(bfs.run_bfs(99)).toEqual({
            status: 'invalid_start',
            start: 99,
            order: [],
            error: '起点 99 不存在',
        })
    })
})

describe('BFS shortest path', () => {
    it('records distances, predecessors, and reconstructs a path', () => {
        const bfs = new BFS_SP()
        bfs.set_graph(graphOf(GraphType.undigraph, [10, 20, 30, 40], [[10, 20], [20, 30], [10, 40]]))

        const result = bfs.run_bfs_sp(10)

        expect(result.status).toBe('complete')
        expect(result.distances.get(30)).toBe(2)
        expect(result.predecessor.get(30)).toBe(20)
        expect(bfs.get_path(30)).toEqual([10, 20, 30])
        expect(bfs.get_path(999)).toEqual([])
    })
})

describe('DFS', () => {
    it('supports non-contiguous node IDs and directed edges', () => {
        const dfs = new DFS()
        dfs.set_graph(graphOf(GraphType.digraph, [10, 20, 30], [[10, 20], [20, 30]]))

        const result = dfs.run_dfs()

        expect(result).toEqual({ status: 'complete', start: 10, order: [10, 20, 30] })
    })

    it('returns a structured result for an empty graph', () => {
        const dfs = new DFS()

        expect(dfs.run_dfs()).toEqual({ status: 'empty', start: null, order: [] })
    })
})
