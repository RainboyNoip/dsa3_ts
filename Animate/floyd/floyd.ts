import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { AnimationFrame } from '../../src/animation/animationTypes'

export type FloydMode = '3d' | '2d'
export type Matrix = number[][]
type Paths = string[][][]
export type FloydFrame = AnimationFrame & {
  phase: 'initial' | 'compare' | 'result'
  k: number
  i: number
  j: number
  before: number
  left: number
  right: number
  candidate: number
  changed: boolean
  matrix: Matrix
  previous: Matrix
  leftPath: string[]
  rightPath: string[]
}
export type FloydRun = { ids: string[]; frames: FloydFrame[]; layers: Matrix[]; error?: string }
const copy = (matrix: Matrix): Matrix => matrix.map(row => [...row])
const copyPaths = (paths: Paths): Paths => paths.map(row => row.map(path => [...path]))
export const formatDistance = (value: number): string => Number.isFinite(value) ? String(value) : '∞'

/** k is the number of permitted intermediate vertices; i and j are zero-based. */
export function runFloyd(nodes: NodeDefinition[], edges: EdgeDefinition[], mode: FloydMode): FloydRun {
  const ids = nodes.map(node => String(node.data.id)).sort((a, b) => Number(a) - Number(b))
  const n = ids.length
  const invalid = (error: string): FloydRun => ({ ids, frames: [], layers: [], error })
  if (!n || n > 8 || new Set(ids).size !== n) return invalid('请输入 1～8 个不同顶点。')
  let matrix: Matrix = ids.map((_, i) => ids.map((__, j) => i === j ? 0 : Infinity))
  let paths: Paths = ids.map((id, i) => ids.map((_, j) => i === j ? [id] : []))
  for (const edge of edges) {
    const i = ids.indexOf(String(edge.data.source)), j = ids.indexOf(String(edge.data.target))
    const weight = Number(edge.data.weight ?? 0)
    if (i < 0 || j < 0 || !Number.isFinite(weight)) return invalid('边的端点或权值无效。')
    if (weight < matrix[i][j]) {
      matrix[i][j] = weight
      paths[i][j] = [ids[i], ids[j]]
    }
  }
  // Validate the entire graph, including negative cycles in disconnected components.
  const check = copy(matrix)
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    check[i][j] = Math.min(check[i][j], check[i][k] + check[k][j])
  }
  if (check.some((row, i) => row[i] < 0)) return invalid('图中存在负环，最短距离无定义。请修改边权后重新播放。')
  if (check.some(row => row.some(value => value === -Infinity))) return invalid('边权过大，距离计算超出数字范围。')
  const initial: FloydFrame = {
    phase: 'initial', k: 0, i: -1, j: -1, before: 0, left: 0, right: 0,
    candidate: 0, changed: false, matrix: copy(matrix), previous: copy(matrix),
    leftPath: [], rightPath: [], edges_state: [], nodes_state: [], jump: [-1, -1],
  }
  const frames = [initial], layers = [copy(matrix)]
  for (let k = 0; k < n; k++) {
    const previous = copy(matrix), previousPaths = copyPaths(paths)
    if (mode === '3d') { matrix = copy(previous); paths = copyPaths(previousPaths) }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const source = mode === '3d' ? previous : matrix
      const sourcePaths = mode === '3d' ? previousPaths : paths
      const before = source[i][j], left = source[i][k], right = source[k][j]
      const candidate = left + right, changed = candidate < before
      const leftPath = [...sourcePaths[i][k]], rightPath = [...sourcePaths[k][j]]
      const visual: Pick<AnimationFrame, 'edges_state' | 'nodes_state'> = {
        nodes_state: [{ id: Number(ids[i]), class: ['visited'] }, { id: Number(ids[j]), class: ['queued'] }, { id: Number(ids[k]), class: ['highlight'] }],
        edges_state: [leftPath, rightPath].flatMap((path, part) => path.slice(1).map((target, index) => ({
          source: Number(path[index]), target: Number(target), class: [part === 0 ? 'visited' : 'queued'],
        }))),
      }
      const frame = { ...visual, k: k + 1, i, j, before, left, right, candidate, changed, previous,
        leftPath, rightPath, jump: [-1, -1] as [number, number] }
      frames.push({ ...frame, phase: 'compare', matrix: copy(matrix) })
      if (changed) {
        matrix[i][j] = candidate
        paths[i][j] = [...leftPath, ...rightPath.slice(1)]
      }
      frames.push({ ...frame, phase: 'result', matrix: copy(matrix) })
    }
    layers.push(copy(matrix))
  }
  return { ids, frames, layers }
}
