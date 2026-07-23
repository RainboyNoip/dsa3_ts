import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult, EdgeState, NodeState } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'

export type TarjanFrameStatus = 'running' | 'complete' | 'empty' | 'invalid'

export type TarjanFrame = AnimationFrame<TarjanFrameStatus> & {
    node_ids: NodeId[]
    dfn: number[]
    low: number[]
    dfs_time: number
    cut_nodes: NodeId[]
    status: TarjanFrameStatus
    log: string
}

export type TarjanCutResult = AnimationResult<'complete' | 'empty' | 'invalid_start' | 'invalid_graph', {
    cut_nodes: NodeId[]
    visited: NodeId[]
    start: NodeId | null
}>

const emptyFrame = (nodeIds: NodeId[] = []): TarjanFrame => ({
    edges_state: [],
    nodes_state: [],
    jump: [-1, -1],
    node_ids: [...nodeIds],
    dfn: nodeIds.map(() => 0),
    low: nodeIds.map(() => 0),
    dfs_time: 0,
    cut_nodes: [],
    status: 'empty',
    log: '',
})

export class TarjanCut {
    public graph: Graph
    private animation = new AnimationTimeline<TarjanFrame>()
    private jumpInfo: pointJumpType = {}
    private dfn = new Map<NodeId, number>()
    private low = new Map<NodeId, number>()
    private dfsTime = 0
    private visited = new Set<NodeId>()
    private cutNodesSet = new Set<NodeId>()
    private result: TarjanCutResult | null = null

    constructor() {
        this.graph = new Graph()
    }

    clear(): void {
        this.animation.clear()
        this.jumpInfo = {}
        this.dfn.clear()
        this.low.clear()
        this.dfsTime = 0
        this.visited.clear()
        this.cutNodesSet.clear()
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }

    set_graph(graph: Graph): void {
        this.graph = graph
        this.resetRunState()
    }

    get_result(): TarjanCutResult | null { return this.result }

    run(start?: NodeId): TarjanCutResult {
        this.resetRunState()
        const nodeIds = this.graph.node_ids
        const startId = start ?? this.graph.getFirstVertex() ?? null

        if (this.graph.is_directed) {
            const error = 'Tarjan 割点算法只支持无向图'
            this.result = {
                status: 'invalid_graph',
                cut_nodes: [],
                visited: [],
                start: startId,
                error,
            }
            this.animation.push({ ...emptyFrame(nodeIds), status: 'invalid', log: error })
            return this.result
        }

        if (startId === null) {
            this.result = { status: 'empty', cut_nodes: [], visited: [], start: null }
            this.animation.push(emptyFrame())
            return this.result
        }

        if (!this.graph.hasVertex(startId)) {
            const error = `起点 ${startId} 不存在`
            this.result = {
                status: 'invalid_start',
                cut_nodes: [],
                visited: [],
                start: startId,
                error,
            }
            this.animation.push({ ...emptyFrame(nodeIds), status: 'invalid', log: error })
            return this.result
        }

        const roots = [startId, ...nodeIds.filter((nodeId) => nodeId !== startId)]
        for (const root of roots) {
            if (!this.dfn.has(root)) {
                this.tarjan(root, null)
            }
        }

        const cutNodes = this.getCutNodes()
        const visited = [...this.visited]
        const result: TarjanCutResult = {
            status: 'complete',
            cut_nodes: cutNodes,
            visited,
            start: startId,
        }
        this.result = result
        this.pushFrame({
            status: 'complete',
            jump: [-1, -1],
            log: `Tarjan 遍历完成，共访问 ${visited.length} 个节点，发现割点：${cutNodes.length > 0 ? cutNodes.join('、') : '无'}`,
        })
        return result
    }

    private resetRunState(): void {
        this.animation.clear()
        this.dfn.clear()
        this.low.clear()
        this.dfsTime = 0
        this.visited.clear()
        this.cutNodesSet.clear()
        this.result = null
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    private snapshot(values: Map<NodeId, number>): number[] {
        return this.graph.node_ids.map((nodeId) => values.get(nodeId) ?? 0)
    }

    private getCutNodes(): NodeId[] {
        return this.graph.node_ids.filter((nodeId) => this.cutNodesSet.has(nodeId))
    }

    private nodeStates(now: NodeId | null): NodeState[] {
        return [...this.visited].map((nodeId) => {
            const classes: string[] = this.cutNodesSet.has(nodeId) ? ['cut'] : ['visited']
            if (nodeId === now) classes.unshift('now_vis')
            return { id: nodeId, class: classes }
        })
    }

    private pushFrame(options: {
        edges_state?: EdgeState[]
        now?: NodeId | null
        jump?: [number, number]
        status?: TarjanFrameStatus
        log: string
    }): void {
        this.animation.push({
            edges_state: options.edges_state || [],
            nodes_state: this.nodeStates(options.now ?? null),
            jump: options.jump || [-1, -1],
            node_ids: this.graph.node_ids,
            dfn: this.snapshot(this.dfn),
            low: this.snapshot(this.low),
            dfs_time: this.dfsTime,
            cut_nodes: this.getCutNodes(),
            status: options.status || 'running',
            log: options.log,
        })
    }

    private tarjan(u: NodeId, parent: NodeId | null): void {
        let childCount = 0
        this.dfsTime += 1
        this.dfn.set(u, this.dfsTime)
        this.low.set(u, this.dfsTime)
        this.visited.add(u)

        this.pushFrame({
            now: u,
            jump: this.jump('tarjan_enter'),
            log: `tarjan 访问到点 ${u}，设置 dfn[${u}]=low[${u}]=${this.dfsTime}`,
        })

        for (const edge of this.graph.getEdgesStartingFrom(u)) {
            const v = edge.target
            if (v === parent) {
                this.pushFrame({
                    edges_state: [{ source: u, target: v, class: ['back_ancestor'] }],
                    now: u,
                    jump: this.jump('tarjan_skip_parent'),
                    log: `${v} 是父亲，是树边，不走`,
                })
                continue
            }

            const isBackEdge = this.dfn.has(v)
            this.pushFrame({
                edges_state: [{ source: u, target: v, class: isBackEdge ? ['back_ancestor'] : ['highlight'] }],
                now: u,
                jump: this.jump('tarjan_check_edge'),
                log: isBackEdge
                    ? `通过边 <${u},${v}>，点 ${v} 已访问，是返祖边`
                    : `通过边 <${u},${v}>，走向点 ${v}`,
            })

            if (isBackEdge) {
                const oldLow = this.low.get(u) as number
                this.low.set(u, Math.min(oldLow, this.dfn.get(v) as number))
                this.pushFrame({
                    now: u,
                    jump: this.jump('tarjan_update_low_back'),
                    log: `用 dfn[${v}]=${this.dfn.get(v)} 更新点 ${u} 的 low 值：${oldLow} -> ${this.low.get(u)}`,
                })
                continue
            }

            this.tarjan(v, u)
            childCount += 1

            const oldLow = this.low.get(u) as number
            this.low.set(u, Math.min(oldLow, this.low.get(v) as number))
            this.pushFrame({
                now: u,
                jump: this.jump('tarjan_update_low_child'),
                log: `利用孩子 ${v} 更新点 ${u} 的 low 值：${oldLow} -> ${this.low.get(u)}`,
            })

            if (parent !== null && (this.low.get(v) as number) >= (this.dfn.get(u) as number)) {
                this.cutNodesSet.add(u)
                this.pushFrame({
                    now: u,
                    jump: this.jump('tarjan_cut_found'),
                    log: `${u} 不是根，且子树 ${v} 上的所有点都回不到 ${u} 的祖先点，${u} 是割点`,
                })
            }
        }

        if (parent === null && childCount > 1) {
            this.cutNodesSet.add(u)
            this.pushFrame({
                now: u,
                jump: this.jump('tarjan_root_cut'),
                log: `${u} 是根，且孩子数量（${childCount}）超过 1，${u} 是割点`,
            })
        }
    }

    get_frame(index: number): TarjanFrame {
        if (index <= 0) return emptyFrame(this.graph.node_ids)
        return this.animation.get(index - 1) || emptyFrame(this.graph.node_ids)
    }

    public get frame_cnt(): number { return this.animation.length }
}
