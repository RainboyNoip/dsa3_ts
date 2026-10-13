import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { AnimationFrame } from './animationTypes'
import type { GraphType } from '../lib/graph_ts'
import type { pointJumpType } from '../lib/read_raw_code'

export type AnimationWorkerAlgorithm =
    | 'bfs'
    | 'bfs_shortest_path'
    | 'dfs'
    | 'topsort'
    | 'dfsscc'
    | 'tarjan_cut'
    | 'fleury'
    | 'hierholzer'

export type AnimationWorkerRequest = {
    requestId: number
    algorithm: AnimationWorkerAlgorithm
    graphType: GraphType
    nodes: NodeDefinition[]
    edges: EdgeDefinition[]
    jumpInfo: pointJumpType
}

export type AnimationWorkerResponse = {
    requestId: number
    ok: true
    frames: AnimationFrame[]
} | {
    requestId: number
    ok: false
    error: string
}
