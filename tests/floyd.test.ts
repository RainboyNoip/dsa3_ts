import { describe, expect, it } from 'vitest'
import { runFloyd } from '../Animate/floyd/floyd'
import samples from '../Animate/floyd/input_data/data.json'

const nodes = (n: number) => Array.from({ length: n }, (_, i) => ({ data: { id: String(i + 1) } }))
const edges = (list: number[][]) => list.map(([source, target, weight]) => ({ data: { source: String(source), target: String(target), weight } }))

describe('Floyd animation', () => {
  it('matches independently computed shortest distances, including negative edges and unreachable vertices', () => {
    for (const sample of samples.slice(0, 3)) {
      const n = sample.nodes.length
      // Bellman–Ford from each source provides an independent oracle.
      const expected = Array.from({ length: n }, (_, start) => {
        const distances = Array<number>(n).fill(Infinity); distances[start] = 0
        for (let iteration = 1; iteration < n; iteration++) for (const { data } of sample.edges) {
          const a = Number(data.source) - 1, b = Number(data.target) - 1
          distances[b] = Math.min(distances[b], distances[a] + data.weight)
        }
        return distances
      })
      for (const mode of ['3d', '2d'] as const) {
        const run = runFloyd(sample.nodes, sample.edges, mode)
        expect(run.error).toBeUndefined()
        expect(run.frames).toHaveLength(1 + 2 * n ** 3)
        expect(run.frames.at(-1)?.matrix).toEqual(expected)
        expect(run.layers.at(-1)).toEqual(expected)
        for (const frame of run.frames.slice(1)) {
          for (const [path, distance] of [[frame.leftPath, frame.left], [frame.rightPath, frame.right]] as const) {
            if (!Number.isFinite(distance)) { expect(path).toEqual([]); continue }
            let cost = 0
            for (let index = 1; index < path.length; index++) {
              const weights = sample.edges.filter(e => e.data.source === path[index - 1] && e.data.target === path[index]).map(e => e.data.weight)
              expect(weights.length).toBeGreaterThan(0)
              cost += Math.min(...weights)
            }
            expect(cost).toBe(distance)
          }
        }
      }
    }
  })
  it('takes three-dimensional sources exclusively from the previous layer and preserves comparison snapshots', () => {
    const run = runFloyd(nodes(3), edges([[1, 2, 2], [2, 3, 3], [1, 3, 9]]), '3d')
    const index = run.frames.findIndex(f => f.k === 2 && f.i === 0 && f.j === 2 && f.phase === 'compare')
    const compare = run.frames[index], result = run.frames[index + 1]
    expect(compare.matrix[0][2]).toBe(9)
    expect(result.matrix[0][2]).toBe(5)
    expect(compare.previous[0][2]).toBe(9)
    expect(run.frames[0].matrix[0][2]).toBe(9)
    for (const f of run.frames.slice(1)) {
      expect(f.left).toBe(run.layers[f.k - 1][f.i][f.k - 1])
      expect(f.right).toBe(run.layers[f.k - 1][f.k - 1][f.j])
    }
  })
  it('rejects negative cycles in disconnected components and negative self loops', () => {
    for (const list of [[[2, 3, -2], [3, 2, 1]], [[1, 1, -1]]]) {
      for (const mode of ['3d', '2d'] as const) {
        const result = runFloyd(nodes(3), edges(list), mode)
        expect(result.error).toContain('负环')
        expect(result.frames).toEqual([])
      }
    }
  })
  it('chooses the minimum parallel edge and keeps zero length self paths', () => {
    const run = runFloyd(nodes(2), edges([[1, 2, 7], [1, 2, 0], [1, 1, 4]]), '2d')
    expect(run.frames.at(-1)?.matrix).toEqual([[0, 0], [Infinity, 0]])
  })
  it('handles eight vertices and rejects larger graphs', () => {
    expect(runFloyd(nodes(8), [], '3d').frames).toHaveLength(1025)
    expect(runFloyd(nodes(9), [], '2d').error).toBeTruthy()
  })
})
