import { describe, expect, it } from 'vitest'
import {
    Edge,
    Graph,
    GraphType,
    Node,
    generateGraphByNodeAndEdgeCount,
} from '../src/lib/graph_ts'

describe('Node and Edge', () => {
    it('returns explicit and fallback node labels without recursion', () => {
        expect(new Node(7, 'start').label).toBe('start')
        expect(new Node(7).label).toBe('7')
        expect(new Node(7).name()).toBe('7')
    })

    it('formats directed and undirected edges correctly', () => {
        const edge = new Edge(1, 2, 5)
        expect(edge.name(GraphType.digraph)).toBe('1 -> 2')
        expect(edge.name(GraphType.undigraph)).toBe('1 -- 2')
        expect(edge.name(GraphType.digraph, true)).toBe('1 -> 2 [weight=5]')
    })
})

describe('Graph mutations', () => {
    it('adds both endpoints and keeps directed adjacency directional', () => {
        const graph = new Graph(GraphType.digraph)
        graph.addEdge(10, 20, 3)

        expect(graph.node_ids).toEqual([10, 20])
        expect(graph.getNeighbors(10)).toEqual([20])
        expect(graph.getNeighbors(20)).toEqual([])
        expect(graph.edge_cnt).toBe(1)
    })

    it('removes an undirected edge regardless of endpoint order', () => {
        const graph = new Graph(GraphType.undigraph)
        graph.addEdge(1, 2)

        expect(graph.removeEdge(2, 1)).toBe(true)
        expect(graph.edge_cnt).toBe(0)
        expect(graph.getNeighbors(1)).toEqual([])
        expect(graph.getNeighbors(2)).toEqual([])
        expect(graph.removeEdge(1, 2)).toBe(false)
    })

    it('removes a vertex from every graph representation', () => {
        const graph = new Graph(GraphType.undigraph)
        graph.addEdge(1, 2)
        graph.addEdge(2, 3)

        expect(graph.removeVertex(2)).toBe(true)
        expect(graph.node_ids).toEqual([1, 3])
        expect(graph.node_cnt).toBe(2)
        expect(graph.edge_cnt).toBe(0)
        expect(graph.getNeighbors(1)).toEqual([])
        expect(graph.getNeighbors(3)).toEqual([])
        expect(graph.removeVertex(2)).toBe(false)
    })
})

describe('Graph text input and output', () => {
    it('parses flexible whitespace and round-trips weighted edges', () => {
        const graph = new Graph(GraphType.digraph)
        const result = graph.readFromString('3   2\n1  2  4\n2\t3\t7\n')

        expect(result).toEqual({ ok: true })
        expect(graph.node_cnt).toBe(3)
        expect(graph.edge_cnt).toBe(2)
        expect(graph.graph_text_data()).toBe('3 2\n1 2 4\n2 3 7')
    })

    it.each([
        ['', '输入不能为空'],
        ['3 x', '首行必须包含整数 n 和 m'],
        ['3 2\n1 2', '声明了 2 条边'],
        ['3 1\n1 4', '超出 1..3'],
        ['3 1\n2 2', '包含自环'],
        ['3 2\n1 2\n2 1', '包含重复边'],
    ])('rejects invalid input without mutating the graph: %s', (input, errorPart) => {
        const graph = new Graph(GraphType.undigraph)
        graph.addEdge(8, 9)

        const result = graph.readFromString(input)

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error).toContain(errorPart)
        }
        expect(graph.node_ids).toEqual([8, 9])
        expect(graph.edge_cnt).toBe(1)
    })
})

describe('connected random graph generation', () => {
    it('returns exactly the requested number of simple edges', () => {
        const graph = generateGraphByNodeAndEdgeCount(8, 12)
        const keys = graph.edges.map((edge) => {
            const source = Number(edge.data.source)
            const target = Number(edge.data.target)
            return `${Math.min(source, target)}:${Math.max(source, target)}`
        })

        expect(graph.nodes).toHaveLength(8)
        expect(graph.edges).toHaveLength(12)
        expect(new Set(keys)).toHaveLength(12)
    })

    it('rejects edge counts that cannot form a connected simple graph', () => {
        expect(() => generateGraphByNodeAndEdgeCount(5, 2)).toThrow('无向连通简单图')
        expect(() => generateGraphByNodeAndEdgeCount(5, 11)).toThrow('无向连通简单图')
    })
})
