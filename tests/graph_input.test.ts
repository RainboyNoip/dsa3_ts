import { describe, expect, it } from 'vitest'
import { GraphType } from '../src/lib/graph_ts'
import { parseGraphInput, serializeGraphInput } from '../src/animation/graphInput'

describe('graph input helpers', () => {
    it('parses valid directed input into a graph', () => {
        const result = parseGraphInput('3 2\n1 2\n2 3 4', GraphType.digraph)

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.graph.type).toBe(GraphType.digraph)
            expect(result.graph.node_ids).toEqual([1, 2, 3])
            expect(result.graph.graph_text_data()).toBe('3 2\n1 2 0\n2 3 4')
        }
    })

    it('keeps parser line information for invalid input', () => {
        const result = parseGraphInput('3 2\n1 2\n2 4', GraphType.undigraph)

        expect(result).toEqual({
            ok: false,
            error: '第 3 行的节点 ID 超出 1..3',
        })
    })

    it('rejects unsupported weights and disconnected active nodes', () => {
        expect(parseGraphInput('3 2\n1 2 5\n2 3', GraphType.undigraph, {
            allowWeights: false,
        })).toEqual({
            ok: false,
            error: '第 2 行不支持边权，当前算法只接受 u v',
        })

        expect(parseGraphInput('4 2\n1 2\n3 4', GraphType.undigraph, {
            requireConnected: true,
        })).toEqual({
            ok: false,
            error: '非孤立节点不连通，当前算法需要连通图',
        })

        const isolated = parseGraphInput('4 1\n1 2', GraphType.undigraph, {
            requireConnected: true,
        })
        expect(isolated.ok).toBe(true)
    })

    it('serializes Cytoscape data into the dialog format', () => {
        const result = serializeGraphInput(
            [{ data: { id: '1' } }, { data: { id: '2' } }],
            [{ data: { source: '1', target: '2', weight: 3 } }],
            GraphType.undigraph,
        )

        expect(result).toBe('2 1\n1 2 3')
    })
})
