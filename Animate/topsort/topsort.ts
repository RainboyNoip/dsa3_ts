import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'

export type TopSortStatus = 'idle' | 'running' | 'complete' | 'cycle'

export type TopSortFrame = AnimationFrame<TopSortStatus> & {
    que: NodeId[]
    top_sort: NodeId[]
    log: string
    status: TopSortStatus
}

export type TopSortResult = AnimationResult<Exclude<TopSortStatus, 'idle' | 'running'>, {
    order: NodeId[]
    remaining: NodeId[]
}>

const emptyFrame = (): TopSortFrame => ({
    edges_state: [],
    nodes_state: [],
    que: [],
    top_sort: [],
    jump: [-1, -1],
    log: '',
    status: 'idle',
})

export class topsort {
    public graph: Graph
    private animation = new AnimationTimeline<TopSortFrame>()
    private jumpInfo: pointJumpType = {}
    private in_degree = new Map<NodeId, number>()
    private queue: NodeId[] = []
    private topsort_list: NodeId[] = []
    private del_edge: Array<[NodeId, NodeId]> = []
    private result: TopSortResult | null = null

    constructor() {
        this.graph = new Graph()
    }

    clear(): void {
        this.animation.clear()
        this.jumpInfo = {}
        this.in_degree.clear()
        this.queue = []
        this.topsort_list = []
        this.del_edge = []
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void {
        this.jumpInfo = jumpInfo
    }

    set_graph(graph: Graph): void {
        this.graph = graph
    }

    set_frames(frames: readonly TopSortFrame[]): void { this.animation.replace(frames) }

    get_result(): TopSortResult | null {
        return this.result
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    private get_in_degree(): void {
        this.in_degree = new Map(this.graph.node_ids.map((nodeId) => [nodeId, 0]))

        for (const edge of this.graph.all_edges) {
            const target = Number(edge.data.target)
            this.in_degree.set(target, (this.in_degree.get(target) || 0) + 1)
        }

        this.queue = this.graph.node_ids.filter((nodeId) => this.in_degree.get(nodeId) === 0)
        this.animation.push({
            edges_state: [],
            nodes_state: [],
            que: [...this.queue],
            top_sort: [],
            jump: this.jump('push zero in_deg point'),
            log: '把入度为0的点加入队列',
            status: 'running',
        })
    }

    private animate_push(log: string, nowVisible: NodeId, jumpName: string): void {
        this.animation.push({
            edges_state: this.del_edge.map(([source, target]) => ({
                source,
                target,
                class: ['del'],
            })),
            nodes_state: [
                { id: nowVisible, class: ['now_vis'] },
                ...this.topsort_list.map((id) => ({ id, class: ['visited'] })),
            ],
            que: [...this.queue],
            top_sort: [...this.topsort_list],
            jump: this.jump(jumpName),
            log,
            status: 'running',
        })
    }

    run_top_sort(): TopSortResult {
        this.animation.clear()
        this.in_degree.clear()
        this.queue = []
        this.topsort_list = []
        this.del_edge = []
        this.result = null
        this.get_in_degree()

        while (this.queue.length > 0) {
            const u = this.queue.shift() as NodeId
            this.topsort_list.push(u)
            this.animate_push(`从队列中取出点: ${u}`, u, 'get u from que')

            for (const edge of this.graph.getEdgesStartingFrom(u)) {
                const v = edge.target
                this.in_degree.set(v, (this.in_degree.get(v) || 0) - 1)
                this.del_edge.push([u, v])
                this.animate_push(`从点${u}中取出周围点${v},并减少入度1`, u, 'get v from u')

                if (this.in_degree.get(v) === 0) {
                    this.queue.push(v)
                    this.animate_push(`点${v}的度为0,加入到队列`, u, 'push v to que')
                }
            }
        }

        const remaining = this.graph.node_ids.filter((nodeId) => !this.topsort_list.includes(nodeId))
        if (remaining.length > 0) {
            const remainingSet = new Set(remaining)
            const cycleEdges = this.graph.all_edges
                .map((edge) => ({
                    source: Number(edge.data.source),
                    target: Number(edge.data.target),
                }))
                .filter(({ source, target }) => remainingSet.has(source) && remainingSet.has(target))
                .map(({ source, target }) => ({ source, target, class: ['cycle'] }))

            this.animation.push({
                edges_state: cycleEdges,
                nodes_state: remaining.map((id) => ({ id, class: ['cycle'] })),
                que: [],
                top_sort: [...this.topsort_list],
                jump: this.jump('cycle detected'),
                log: `检测到环，剩余 ${remaining.length} 个节点无法加入拓扑序`,
                status: 'cycle',
            })
            this.result = {
                status: 'cycle',
                order: [...this.topsort_list],
                remaining,
            }
            return this.result
        }

        this.animation.push({
            edges_state: this.del_edge.map(([source, target]) => ({ source, target, class: ['del'] })),
            nodes_state: this.topsort_list.map((id) => ({ id, class: ['visited'] })),
            que: [],
            top_sort: [...this.topsort_list],
            jump: this.jump('top_sort_done'),
            log: `拓扑排序完成，共 ${this.topsort_list.length} 个节点`,
            status: 'complete',
        })
        this.result = {
            status: 'complete',
            order: [...this.topsort_list],
            remaining: [],
        }
        return this.result
    }

    get_frame(index: number): TopSortFrame {
        if (index <= 0) {
            return emptyFrame()
        }
        return this.animation.get(index - 1) || emptyFrame()
    }

    public get frame_cnt(): number {
        return this.animation.length
    }
}
