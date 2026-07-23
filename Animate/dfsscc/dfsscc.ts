import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult, EdgeState, NodeState } from '../../src/animation/animationTypes'

export type SccFrameStatus = 'running' | 'complete' | 'empty' | 'invalid'

export type SccFrame = AnimationFrame<SccFrameStatus> & {
    node_ids: NodeId[]
    color: number[]
    stack: NodeId[]
    dfn: number[]
    low: number[]
    status: SccFrameStatus
    log: string
}

export type DfssccResult = AnimationResult<'complete' | 'empty' | 'invalid_start' | 'invalid_graph', {
    start: NodeId | null
    visited: NodeId[]
    components: NodeId[][]
    component_by_node: Map<NodeId, number>
}>

const palette = [
    '#2563eb',
    '#db2777',
    '#059669',
    '#d97706',
    '#7c3aed',
    '#0891b2',
    '#dc2626',
    '#4f46e5',
]

const emptyFrame = (nodeIds: NodeId[] = []): SccFrame => ({
    edges_state: [],
    nodes_state: [],
    jump: [-1, -1],
    node_ids: [...nodeIds],
    color: nodeIds.map(() => 0),
    stack: [],
    dfn: nodeIds.map(() => 0),
    low: nodeIds.map(() => 0),
    status: 'empty',
    log: '',
})

export class Dfsscc {
    private animation: SccFrame[] = []
    private jumpInfo: pointJumpType
    private dfn = new Map<NodeId, number>()
    private low = new Map<NodeId, number>()
    private color = new Map<NodeId, number>()
    private visited = new Set<NodeId>()
    private inStack = new Set<NodeId>()
    private stack: NodeId[] = []
    private time = 0
    private colorCount = 0
    private allEdges: EdgeState[] = []
    private components: NodeId[][] = []
    private result: DfssccResult | null = null

    constructor(
        private graph: Graph,
        jumpInfo: pointJumpType = {},
    ) {
        this.jumpInfo = jumpInfo
        this.resetRunState()
    }

    set_jumpInfo(jumpInfo: pointJumpType): void {
        this.jumpInfo = jumpInfo
    }

    set_graph(graph: Graph): void {
        this.graph = graph
        this.resetRunState()
    }

    get_result(): DfssccResult | null {
        return this.result
    }

    number_to_color(component: number): string {
        if (component <= 0) return '#cbd5e1'
        return palette[(component - 1) % palette.length]
    }

    run_dfsscc(start?: NodeId): DfssccResult {
        this.resetRunState()
        const nodeIds = this.graph.node_ids
        const startId = start ?? this.graph.getFirstVertex() ?? null

        if (this.graph.is_undirected) {
            const error = '强连通分量算法只支持有向图'
            this.result = {
                status: 'invalid_graph',
                start: startId,
                visited: [],
                components: [],
                component_by_node: new Map(),
                error,
            }
            this.animation.push({ ...emptyFrame(nodeIds), status: 'invalid', log: error })
            return this.result
        }

        if (startId === null) {
            this.result = {
                status: 'empty',
                start: null,
                visited: [],
                components: [],
                component_by_node: new Map(),
            }
            this.animation.push(emptyFrame())
            return this.result
        }

        if (!this.graph.hasVertex(startId)) {
            const error = `起点 ${startId} 不存在`
            this.result = {
                status: 'invalid_start',
                start: startId,
                visited: [],
                components: [],
                component_by_node: new Map(),
                error,
            }
            this.animation.push({ ...emptyFrame(nodeIds), status: 'invalid', log: error })
            return this.result
        }

        const roots = [startId, ...nodeIds.filter((nodeId) => nodeId !== startId)]
        for (const root of roots) {
            if (!this.visited.has(root)) {
                this.pushFrame('dfsscc_start', `点 ${root} 没有被访问过，开始 DFS`)
                this.dfs(root)
            }
        }

        const result: DfssccResult = {
            status: 'complete',
            start: startId,
            visited: [...this.visited],
            components: this.components.map((component) => [...component]),
            component_by_node: new Map(this.color),
        }
        this.result = result
        this.pushFrame('', `SCC 遍历完成，共访问 ${result.visited.length} 个节点，发现 ${result.components.length} 个强连通分量`, 'complete')
        return result
    }

    private resetRunState(): void {
        this.animation = []
        this.dfn.clear()
        this.low.clear()
        this.color.clear()
        this.visited.clear()
        this.inStack.clear()
        this.stack = []
        this.time = 0
        this.colorCount = 0
        this.components = []
        this.result = null
        this.allEdges = this.graph.all_edges.map((edge) => ({
            source: Number(edge.data.source),
            target: Number(edge.data.target),
            class: [],
        }))
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    private values(values: Map<NodeId, number>): number[] {
        return this.graph.node_ids.map((nodeId) => values.get(nodeId) ?? 0)
    }

    private nodeStates(now: NodeId | null): NodeState[] {
        return this.graph.node_ids.map((nodeId) => {
            const component = this.color.get(nodeId) ?? 0
            const classes = component > 0 ? ['colored'] : []
            if (nodeId === now) classes.unshift('now_vis')
            return {
                id: nodeId,
                class: classes,
                color: this.number_to_color(component),
            }
        })
    }

    private pushFrame(
        jumpName: string,
        log: string,
        status: SccFrameStatus = 'running',
        now: NodeId | null = null,
    ): void {
        this.animation.push({
            edges_state: this.allEdges.map((edge) => ({
                source: edge.source,
                target: edge.target,
                class: [...edge.class],
            })),
            nodes_state: this.nodeStates(now),
            jump: jumpName ? this.jump(jumpName) : [-1, -1],
            node_ids: this.graph.node_ids,
            color: this.values(this.color),
            stack: [...this.stack],
            dfn: this.values(this.dfn),
            low: this.values(this.low),
            status,
            log,
        })
    }

    private setEdgeState(source: NodeId, target: NodeId, className: string): void {
        for (const edge of this.allEdges) {
            if (edge.source === source && edge.target === target) {
                edge.class = [className]
            }
        }
    }

    private dfs(u: NodeId): void {
        this.time += 1
        this.dfn.set(u, this.time)
        this.low.set(u, this.time)
        this.visited.add(u)
        this.stack.push(u)
        this.inStack.add(u)
        this.pushFrame('set some value', `到达点 ${u}，设置 dfn、low、visited，并入栈`, 'running', u)

        for (const edge of this.graph.getEdgesStartingFrom(u)) {
            const v = edge.target
            if (!this.visited.has(v)) {
                this.setEdgeState(u, v, 'tree')
                this.pushFrame('not visited', `点 ${u} 到达点 ${v}，${v} 没有被访问过，开始 DFS`, 'running', u)
                this.dfs(v)
                this.low.set(u, Math.min(this.low.get(u) as number, this.low.get(v) as number))
                this.pushFrame('update_low_1', `用点 ${v} 更新点 ${u} 的 low`, 'running', u)
            } else if (this.inStack.has(v)) {
                this.setEdgeState(u, v, 'back_ancestor')
                this.low.set(u, Math.min(this.low.get(u) as number, this.dfn.get(v) as number))
                this.pushFrame('update_low_2', `用 dfn[${v}] 更新点 ${u} 的 low`, 'running', u)
            } else {
                this.setEdgeState(u, v, 'other')
                this.pushFrame('', `点 ${v} 已完成一个强连通分量，边 <${u},${v}> 不更新 low`, 'running', u)
            }
        }

        if (this.low.get(u) !== this.dfn.get(u)) return

        this.colorCount += 1
        const component: NodeId[] = []
        let top: NodeId
        do {
            top = this.stack.pop() as NodeId
            this.inStack.delete(top)
            this.color.set(top, this.colorCount)
            component.push(top)
            this.pushFrame('set strong connected component', `点 ${top} 的强连通分量编号为 ${this.colorCount}`, 'running', u)
        } while (top !== u)

        const nodeOrder = new Map(this.graph.node_ids.map((nodeId, index) => [nodeId, index]))
        component.sort((left, right) => (nodeOrder.get(left) as number) - (nodeOrder.get(right) as number))
        this.components.push(component)
    }

    get frame_cnt(): number {
        return this.animation.length
    }

    get_frame(index: number): SccFrame {
        if (index <= 0) return emptyFrame(this.graph.node_ids)
        return this.animation[index - 1] || emptyFrame(this.graph.node_ids)
    }
}
