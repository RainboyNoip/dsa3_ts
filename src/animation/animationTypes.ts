import type { NodeId } from '../lib/graph_ts'

/** Source-code line range associated with an animation frame. */
export type JumpRange = [number, number]

/** Visual state for one graph node in an animation frame. */
export type NodeState = {
    id: NodeId
    class: string[]
    color?: string
}

/** Visual state for one graph edge in an animation frame. */
export type EdgeState = {
    source: NodeId
    target: NodeId
    class: string[]
    dfn?: number
}

/** Result statuses shared by all algorithm runners. */
export type AnimationSuccessStatus = 'complete'
export type AnimationEmptyStatus = 'empty'
export type AnimationNoSolutionStatus = 'cycle' | 'no_euler_trail'
export type AnimationInputErrorStatus = 'invalid_start' | 'invalid_graph'
export type AnimationResultStatus =
    | AnimationSuccessStatus
    | AnimationEmptyStatus
    | AnimationNoSolutionStatus
    | AnimationInputErrorStatus

/** Shared visual portion of every algorithm animation frame. */
export type AnimationFrame<Status extends string = string> = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: JumpRange
    status?: Status
}

/** Common shape for algorithm execution results. */
export type AnimationResult<Status extends AnimationResultStatus, Data extends object = Record<never, never>> = Data & {
    status: Status
    error?: string
}
