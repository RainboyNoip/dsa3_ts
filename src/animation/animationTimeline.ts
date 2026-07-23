import type { EdgeState, AnimationFrame, NodeState } from './animationTypes'

type VisualState = NodeState | EdgeState

type VisualSnapshot<State extends VisualState> = {
    values: Map<string, State>
    order: string[]
}

type VisualPatch<State extends VisualState> = {
    changed: Array<[string, State | null]>
    order?: string[]
}

type StoredFrame<Frame extends AnimationFrame> = {
    payload: Omit<Frame, 'nodes_state' | 'edges_state'>
    nodes: VisualPatch<NodeState>
    edges: VisualPatch<EdgeState>
    nodeCheckpoint?: VisualSnapshot<NodeState>
    edgeCheckpoint?: VisualSnapshot<EdgeState>
}

const DEFAULT_CHECKPOINT_INTERVAL = 32

/**
 * Stores animation frames as visual-state patches while keeping the public
 * get(index) shape identical to a full AnimationFrame.
 */
export class AnimationTimeline<Frame extends AnimationFrame> {
    private frames: Array<StoredFrame<Frame>> = []
    private currentNodes: VisualSnapshot<NodeState> = { values: new Map(), order: [] }
    private currentEdges: VisualSnapshot<EdgeState> = { values: new Map(), order: [] }

    constructor(private readonly checkpointInterval = DEFAULT_CHECKPOINT_INTERVAL) {}

    get length(): number {
        return this.frames.length
    }

    clear(): void {
        this.frames = []
        this.currentNodes = { values: new Map(), order: [] }
        this.currentEdges = { values: new Map(), order: [] }
    }

    push(frame: Frame): void {
        const { nodes_state, edges_state, ...payload } = frame
        const nodes = createPatch(this.currentNodes, nodes_state, nodeKey)
        const edges = createPatch(this.currentEdges, edges_state, edgeKey)
        const index = this.frames.length
        const stored: StoredFrame<Frame> = { payload, nodes, edges }

        if (index % this.checkpointInterval === 0) {
            stored.nodeCheckpoint = snapshotFromStates(nodes_state, nodeKey)
            stored.edgeCheckpoint = snapshotFromStates(edges_state, edgeKey)
        }

        this.frames.push(stored)
        this.currentNodes = applyPatch(this.currentNodes, nodes)
        this.currentEdges = applyPatch(this.currentEdges, edges)
    }

    get(index: number): Frame | undefined {
        if (index < 0 || index >= this.frames.length) return undefined

        let checkpointIndex = index
        while (checkpointIndex > 0 && !this.frames[checkpointIndex].nodeCheckpoint) checkpointIndex -= 1
        const checkpoint = this.frames[checkpointIndex]
        let nodes = cloneSnapshot(checkpoint.nodeCheckpoint)
        let edges = cloneSnapshot(checkpoint.edgeCheckpoint)

        for (let currentIndex = checkpointIndex + 1; currentIndex <= index; currentIndex += 1) {
            const current = this.frames[currentIndex]
            nodes = applyPatch(nodes, current.nodes)
            edges = applyPatch(edges, current.edges)
        }

        const target = this.frames[index]
        return {
            ...target.payload,
            nodes_state: nodes.order.map((key) => nodes.values.get(key) as NodeState),
            edges_state: edges.order.map((key) => edges.values.get(key) as EdgeState),
        } as Frame
    }
}

function createPatch<State extends VisualState>(
    previous: VisualSnapshot<State>,
    next: readonly State[],
    keyOf: (state: State, occurrence: number) => string,
): VisualPatch<State> {
    const nextValues = new Map<string, State>()
    const nextOrder: string[] = []
    for (const [occurrence, state] of next.entries()) {
        const key = keyOf(state, occurrence)
        nextValues.set(key, cloneState(state))
        nextOrder.push(key)
    }

    const changed: Array<[string, State | null]> = []
    for (const key of previous.order) {
        if (!nextValues.has(key)) changed.push([key, null])
    }
    for (const key of nextOrder) {
        const before = previous.values.get(key)
        const after = nextValues.get(key) as State
        if (!before || !sameState(before, after)) changed.push([key, after])
    }

    return {
        changed,
        ...(sameOrder(previous.order, nextOrder) ? {} : { order: nextOrder }),
    }
}

function applyPatch<State extends VisualState>(
    previous: VisualSnapshot<State>,
    patch: VisualPatch<State>,
): VisualSnapshot<State> {
    const values = new Map(previous.values)
    for (const [key, state] of patch.changed) {
        if (state === null) values.delete(key)
        else values.set(key, cloneState(state))
    }

    const order = patch.order
        ? [...patch.order]
        : previous.order.filter((key) => values.has(key))
    return { values, order }
}

function snapshotFromStates<State extends VisualState>(
    states: readonly State[],
    keyOf: (state: State, occurrence: number) => string,
): VisualSnapshot<State> {
    const values = new Map<string, State>()
    const order: string[] = []
    for (const [occurrence, state] of states.entries()) {
        const key = keyOf(state, occurrence)
        values.set(key, cloneState(state))
        order.push(key)
    }
    return { values, order }
}

function cloneSnapshot<State extends VisualState>(snapshot: VisualSnapshot<State> | undefined): VisualSnapshot<State> {
    if (snapshot) {
        return {
            values: new Map([...snapshot.values].map(([key, value]) => [key, cloneState(value)])),
            order: [...snapshot.order],
        }
    }
    return { values: new Map(), order: [] }
}

function cloneState<State extends VisualState>(state: State): State {
    return {
        ...state,
        class: [...state.class],
    } as State
}

function sameState(left: VisualState, right: VisualState): boolean {
    if ('id' in left || 'id' in right) {
        if (!('id' in left && 'id' in right) || left.id !== right.id) return false
    }
    if ('source' in left && 'source' in right && (left.source !== right.source || left.target !== right.target)) return false
    const leftColor = 'color' in left ? left.color : undefined
    const rightColor = 'color' in right ? right.color : undefined
    const leftDfn = 'dfn' in left ? left.dfn : undefined
    const rightDfn = 'dfn' in right ? right.dfn : undefined
    if (leftColor !== rightColor || leftDfn !== rightDfn || left.class.length !== right.class.length) return false
    return left.class.every((className, index) => className === right.class[index])
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((key, index) => key === right[index])
}

function nodeKey(state: NodeState, occurrence: number): string {
    return `${state.id}\u0000${occurrence}`
}

function edgeKey(state: EdgeState, occurrence: number): string {
    return `${state.source}\u0000${state.target}\u0000${occurrence}`
}
