import { describe, expect, it } from 'vitest'
import { Graph, GraphType, type NodeId } from '../src/lib/graph_ts'
import { Hierholzer, type HierholzerFrame, type HierholzerResult } from '../Animate/hierholzer/hierholzer'

const graphOf = (nodes: number[], edges: Array<[number, number]>, type = GraphType.undigraph) => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

const edgeKey = (u: NodeId, v: NodeId): string => [Math.min(u, v), Math.max(u, v)].join('-')

const countEdges = (pairs: Array<[NodeId, NodeId]>): Map<string, number> => {
    const counts = new Map<string, number>()
    for (const [u, v] of pairs) {
        const key = edgeKey(u, v)
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
}

const inputEdges = (graph: Graph): Array<[NodeId, NodeId]> => graph.all_edges.map((edge) => (
    [Number(edge.data.source), Number(edge.data.target)] as [NodeId, NodeId]
))

const expectValidTrail = (graph: Graph, result: HierholzerResult): void => {
    expect(result.status).toBe('complete')
    const expected = countEdges(inputEdges(graph))
    // 走过的边恰好是全部输入边各一次
    expect(countEdges(result.edges)).toEqual(expected)
    // 顶点序列相邻两点之间也恰好用掉每条边一次
    const trailEdges = result.path.slice(0, -1).map((node, index) => (
        [node, result.path[index + 1] as NodeId] as [NodeId, NodeId]
    ))
    expect(countEdges(trailEdges)).toEqual(expected)
    expect(result.path).toHaveLength(graph.edge_cnt + 1)
    expect(result.path[0]).toBe(result.start)
    expect(result.rawPath).toEqual([...result.path].reverse())
}

describe('Hierholzer Euler trail', () => {
    it('follows the contest short version on the article sample graph', () => {
        const graph = graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 4], [4, 2], [3, 5], [5, 1]])
        const algorithm = new Hierholzer()
        algorithm.set_graph(graph)

        const result = algorithm.run()

        // 忠实竞赛精简版：s 取最后一个奇点，答案不唯一，这里锁住确定性输出
        expectValidTrail(graph, result)
        expect(result.start).toBe(3)
        expect(result.path).toEqual([3, 2, 1, 5, 3, 4, 2])
        expect(result.isCircuit).toBe(false)
        expect(algorithm.get_frame(0).status).toBe('empty')
        expect(algorithm.get_frame(algorithm.frame_cnt).status).toBe('complete')
    })

    it('finds the Euler circuit on the two-triangle graph', () => {
        const graph = graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 1], [3, 4], [4, 5], [5, 3]])
        const algorithm = new Hierholzer()
        algorithm.set_graph(graph)

        const result = algorithm.run()

        expectValidTrail(graph, result)
        expect(result.start).toBe(1)
        expect(result.path).toEqual([1, 2, 3, 4, 5, 3, 1])
        expect(result.isCircuit).toBe(true)
    })

    it('collects detour rings before the main trail on the backbone graph', () => {
        const graph = graphOf(
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [[1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 2], [3, 8], [8, 9], [9, 3]],
        )
        const algorithm = new Hierholzer()
        algorithm.set_graph(graph)

        const result = algorithm.run()

        expectValidTrail(graph, result)
        expect(result.start).toBe(5)
        expect(result.path[0]).toBe(5)
        expect(result.path[result.path.length - 1]).toBe(1)
        expect(result.isCircuit).toBe(false)
    })

    it('accepts an explicit start vertex', () => {
        const graph = graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 4], [4, 2], [3, 5], [5, 1]])
        const algorithm = new Hierholzer()
        algorithm.set_graph(graph)

        const result = algorithm.run(3)

        expectValidTrail(graph, result)
        expect(result.start).toBe(3)
    })

    it('handles parallel edges and self loops', () => {
        const parallel = graphOf([1, 2], [[1, 2], [1, 2]])
        const parallelResult = new Hierholzer()
        parallelResult.set_graph(parallel)
        expectValidTrail(parallel, parallelResult.run())
        expect(parallelResult.get_result()?.path).toEqual([1, 2, 1])

        const loop = graphOf([1, 2, 3], [[1, 2], [2, 2], [2, 3]])
        const loopAlgorithm = new Hierholzer()
        loopAlgorithm.set_graph(loop)
        expectValidTrail(loop, loopAlgorithm.run())
        expect(loopAlgorithm.get_result()?.path).toEqual([3, 2, 2, 1])
    })

    it('rejects graphs with more than two odd-degree vertices', () => {
        const algorithm = new Hierholzer()
        algorithm.set_graph(graphOf([1, 2, 3, 4], [[1, 2], [1, 3], [1, 4]]))

        expect(algorithm.run()).toEqual({
            status: 'no_euler_trail',
            start: null,
            path: [],
            rawPath: [],
            edges: [],
            isCircuit: false,
            error: '奇度点个数为 4，不是 0 或 2，无欧拉路',
        })

        // 文章的不可行用例也是在判定期就被拦下（4 个奇点）
        const articleCase = new Hierholzer()
        articleCase.set_graph(graphOf([1, 2, 3, 4], [[1, 2], [3, 4]]))
        const articleResult = articleCase.run()
        expect(articleResult.status).toBe('no_euler_trail')
        expect(articleResult.error).toBe('奇度点个数为 4，不是 0 或 2，无欧拉路')
    })

    it('rejects disconnected graphs that pass the degree check', () => {
        // 三角形全偶度 + 一条独立边：奇点 2 个判定过关，但只能走完 1 条边
        const algorithm = new Hierholzer()
        algorithm.set_graph(graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 1], [4, 5]]))

        expect(algorithm.run()).toEqual({
            status: 'no_euler_trail',
            start: 5,
            path: [],
            rawPath: [],
            edges: [],
            isCircuit: false,
            error: '只收集到 2 个点，没有覆盖全部 4 条边，有边的点不连通，无欧拉路',
        })
    })

    it('handles empty, directed, and invalid-start inputs', () => {
        const empty = new Hierholzer()
        empty.set_graph(new Graph(GraphType.undigraph))
        expect(empty.run().status).toBe('empty')

        // 边界：有点但没有任何边，欧拉路是空序列
        const noEdges = new Hierholzer()
        noEdges.set_graph(graphOf([1, 2, 3], []))
        expect(noEdges.run().status).toBe('empty')

        const directed = new Hierholzer()
        directed.set_graph(graphOf([1, 2, 3], [[1, 2], [2, 3], [3, 1]], GraphType.digraph))
        expect(directed.run().status).toBe('invalid_graph')

        const invalidStart = new Hierholzer()
        invalidStart.set_graph(graphOf([1, 2, 3], [[1, 2], [2, 3], [3, 1]]))
        expect(invalidStart.run(99).status).toBe('invalid_start')

        const isolatedStart = new Hierholzer()
        isolatedStart.set_graph(graphOf([1, 2, 3, 4], [[1, 2], [2, 3], [3, 1]]))
        expect(isolatedStart.run(4).status).toBe('invalid_start')
    })

    it('keeps stack, path, and edge numbering consistent in every frame', () => {
        const graph = graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 4], [4, 2], [3, 5], [5, 1]])
        const algorithm = new Hierholzer()
        algorithm.set_graph(graph)
        const result = algorithm.run()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expect(frame.jump).toHaveLength(2)
            expect(frame.nodes_state.every((node) => graph.hasVertex(node.id))).toBe(true)
            expect(frame.stack.every((node) => graph.hasVertex(node))).toBe(true)
            expect(frame.path.every((node) => graph.hasVertex(node))).toBe(true)
            expect(frame.current === null || graph.hasVertex(frame.current)).toBe(true)
            if (frame.stack.length > 0) {
                expect(frame.current).toBe(frame.stack[frame.stack.length - 1])
            }

            const orders = frame.edges_state
                .map((edge) => edge.dfn)
                .filter((dfn): dfn is number => dfn !== undefined)
            expect(new Set(orders).size).toBe(orders.length)
            expect(orders.every((order) => Number.isInteger(order) && order > 0)).toBe(true)
            for (const edge of frame.edges_state) {
                const used = edge.class.includes('highlight') || edge.class.includes('visited')
                expect(used).toBe(edge.dfn !== undefined)
            }
        }

        const lastFrame = algorithm.get_frame(algorithm.frame_cnt)
        expect(lastFrame.path).toEqual(result.path)
    })

    it('replays serialized worker frames identically', () => {
        const graph = graphOf([1, 2, 3, 4, 5], [[1, 2], [2, 3], [3, 4], [4, 2], [3, 5], [5, 1]])
        const source = new Hierholzer()
        source.set_graph(graph)
        source.run()

        const frames: HierholzerFrame[] = Array.from(
            { length: source.frame_cnt },
            (_, index) => source.get_frame(index + 1),
        )
        const replay = new Hierholzer()
        replay.set_frames(frames)

        expect(replay.frame_cnt).toBe(frames.length)
        expect(replay.get_frame(1)).toEqual(frames[0])
        expect(replay.get_frame(frames.length)).toEqual(frames[frames.length - 1])
    })
})
