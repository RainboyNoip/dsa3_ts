import { describe, expect, it } from 'vitest'
import { Graph, GraphType, type NodeId } from '../src/lib/graph_ts'
import type { AnimationFrame } from '../src/animation/animationTypes'
import { BFS } from '../Animate/bfs/bfs'
import { BFS_SP } from '../Animate/bfs_shortest_path/bfs_sp'
import { DFS } from '../Animate/dfs/dfs'
import { Dfsscc } from '../Animate/dfsscc/dfsscc'
import { fleury } from '../Animate/fleury/fleury'
import { TarjanCut } from '../Animate/tarjan_cut/tarjan'
import { topsort } from '../Animate/topsort/topsort'
import { KMP } from '../Animate/kmp/kmp'

const graphOf = (
    type: GraphType,
    nodes: number[],
    edges: Array<[number, number]>,
): Graph => {
    const graph = new Graph(type)
    nodes.forEach((node) => graph.addVertex(node))
    edges.forEach(([source, target]) => graph.addEdge(source, target))
    return graph
}

const expectCommonFrameState = <Frame extends AnimationFrame>(
    frame: Frame,
    nodeIds: NodeId[],
): void => {
    const ids = new Set(nodeIds)
    expect(frame.jump).toHaveLength(2)
    expect(frame.nodes_state.every((node) => ids.has(node.id))).toBe(true)
    expect(frame.edges_state.every((edge) => ids.has(edge.source) && ids.has(edge.target))).toBe(true)
}

describe('animation frame invariants', () => {
    it('keeps KMP pointers, prefix tables, and comparison locations bounded', () => {
        const algorithm = new KMP()
        algorithm.set_input('ABABDABACDABABCABAB', 'ABABCABAB')
        algorithm.run()

        for (let index = 0; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expect(frame.lps).toHaveLength(frame.pattern.length)
            expect(frame.i).toBeGreaterThanOrEqual(0)
            expect(frame.i).toBeLessThanOrEqual(frame.text.length)
            expect(frame.j).toBeGreaterThanOrEqual(0)
            expect(frame.j).toBeLessThanOrEqual(frame.pattern.length)
            expect(frame.jump).toHaveLength(2)
            if (frame.compare) {
                expect(frame.compare.textIndex).toBeGreaterThanOrEqual(0)
                expect(frame.compare.textIndex).toBeLessThanOrEqual(frame.text.length - 1)
                expect(frame.compare.patternIndex).toBeGreaterThanOrEqual(0)
                expect(frame.compare.patternIndex).toBeLessThanOrEqual(frame.pattern.length - 1)
            }
        }
    })

    it('keeps BFS queue and visited state consistent in every frame', () => {
        const graph = graphOf(GraphType.undigraph, [10, 20, 30, 42], [[10, 20], [20, 30]])
        const algorithm = new BFS()
        algorithm.set_graph(graph)
        algorithm.run_bfs()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(new Set(frame.visited).size).toBe(frame.visited.length)
            expect(new Set(frame.que).size).toBe(frame.que.length)
            expect(frame.que.every((node) => frame.visited.includes(node))).toBe(true)
            expect(frame.poped.every((node) => frame.visited.includes(node))).toBe(true)
            expect(frame.head === null || frame.visited.includes(frame.head)).toBe(true)
        }
    })

    it('keeps DFS discovery order unique and bounded to graph nodes', () => {
        const graph = graphOf(GraphType.digraph, [10, 20, 30, 40], [[10, 20], [20, 30], [10, 40]])
        const algorithm = new DFS()
        algorithm.set_graph(graph)
        algorithm.run_dfs()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(new Set(frame.dfn).size).toBe(frame.dfn.length)
            expect(frame.dfn.every((node) => graph.hasVertex(node))).toBe(true)
        }
    })

    it('keeps BFS shortest-path queue distances valid in every frame', () => {
        const graph = graphOf(GraphType.undigraph, [10, 20, 30, 40], [[10, 20], [20, 30], [10, 40]])
        const algorithm = new BFS_SP()
        algorithm.set_graph(graph)
        algorithm.run_bfs_sp(10)

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(new Set(frame.que.map(([node]) => node)).size).toBe(frame.que.length)
            expect(frame.que.every(([node, distance]) => graph.hasVertex(node) && Number.isInteger(distance) && distance >= 0)).toBe(true)
            expect(frame.head === null || (graph.hasVertex(frame.head[0]) && frame.head[1] >= 0)).toBe(true)
        }
    })

    it('keeps topological queue and output sequences duplicate-free', () => {
        const graph = graphOf(GraphType.digraph, [10, 20, 30, 40], [[10, 30], [20, 30], [30, 40]])
        const algorithm = new topsort()
        algorithm.set_graph(graph)
        algorithm.run_top_sort()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(new Set(frame.que).size).toBe(frame.que.length)
            expect(new Set(frame.top_sort).size).toBe(frame.top_sort.length)
            expect(frame.que.every((node) => graph.hasVertex(node))).toBe(true)
            expect(frame.top_sort.every((node) => graph.hasVertex(node))).toBe(true)
        }
    })

    it('keeps SCC frame tables aligned with the node order', () => {
        const graph = graphOf(GraphType.digraph, [10, 20, 30, 40], [[10, 20], [20, 10], [20, 30], [30, 40]])
        const algorithm = new Dfsscc(graph)
        algorithm.run_dfsscc()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(frame.node_ids).toEqual(graph.node_ids)
            expect(frame.color).toHaveLength(graph.node_cnt)
            expect(frame.dfn).toHaveLength(graph.node_cnt)
            expect(frame.low).toHaveLength(graph.node_cnt)
            expect(new Set(frame.stack).size).toBe(frame.stack.length)
            expect(frame.stack.every((node) => graph.hasVertex(node))).toBe(true)
        }
    })

    it('keeps Tarjan cut-vertex tables aligned across components', () => {
        const graph = graphOf(GraphType.undigraph, [10, 20, 30, 40], [[10, 20], [20, 30]])
        const algorithm = new TarjanCut()
        algorithm.set_graph(graph)
        algorithm.run()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(frame.node_ids).toEqual(graph.node_ids)
            expect(frame.dfn).toHaveLength(graph.node_cnt)
            expect(frame.low).toHaveLength(graph.node_cnt)
            expect(frame.cut_nodes.every((node) => graph.hasVertex(node))).toBe(true)
        }
    })

    it('keeps Fleury path and removed-edge numbering consistent', () => {
        const graph = graphOf(GraphType.undigraph, [10, 20, 30], [[10, 20], [20, 30], [30, 10]])
        const algorithm = new fleury()
        algorithm.set_graph(graph)
        algorithm.run()

        for (let index = 1; index <= algorithm.frame_cnt; index += 1) {
            const frame = algorithm.get_frame(index)
            expectCommonFrameState(frame, graph.node_ids)
            expect(frame.path.every((node) => graph.hasVertex(node))).toBe(true)
            expect(frame.current === null || graph.hasVertex(frame.current)).toBe(true)

            const removedOrder = frame.edges_state
                .map((edge) => edge.dfn)
                .filter((dfn): dfn is number => dfn !== undefined)
            expect(new Set(removedOrder).size).toBe(removedOrder.length)
            expect(removedOrder.every((dfn) => Number.isInteger(dfn) && dfn > 0)).toBe(true)
        }
    })
})
