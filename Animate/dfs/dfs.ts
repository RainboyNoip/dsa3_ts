import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'

export type DFSFrame = AnimationFrame & {
    dfn: NodeId[]
    log: string
}

export type DFSResult = AnimationResult<'complete' | 'empty' | 'invalid_start', {
    scope: 'reachable_component'
    start: NodeId | null
    order: NodeId[]
}>

const emptyFrame = (): DFSFrame => ({
    edges_state: [],
    nodes_state: [],
    dfn: [],
    jump: [-1, -1],
    log: '',
})

export class DFS {
    public graph: Graph = new Graph()
    private animation = new AnimationTimeline<DFSFrame>()
    private jumpInfo: pointJumpType = {}
    private dfn: NodeId[] = []
    private visited = new Set<NodeId>()
    private result: DFSResult | null = null

    clear(): void {
        this.animation.clear()
        this.jumpInfo = {}
        this.dfn = []
        this.visited.clear()
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }
    set_graph(graph: Graph): void { this.graph = graph }
    set_frames(frames: readonly DFSFrame[]): void { this.animation.replace(frames) }
    get_result(): DFSResult | null { return this.result }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    run_dfs(start?: NodeId): DFSResult {
        this.animation.clear()
        this.dfn = []
        this.visited.clear()
        const startId = start ?? this.graph.getFirstVertex() ?? null
        if (startId === null) {
            this.result = { status: 'empty', scope: 'reachable_component', start: null, order: [] }
            this.animation.push({ ...emptyFrame(), log: '图为空，没有可遍历的节点' })
            return this.result
        }
        if (!this.graph.hasVertex(startId)) {
            const error = `起点 ${startId} 不存在`
            this.result = {
                status: 'invalid_start',
                scope: 'reachable_component',
                start: startId,
                order: [],
                error,
            }
            this.animation.push({ ...emptyFrame(), log: error })
            return this.result
        }

        this.dfs(startId, null)
        this.result = {
            status: 'complete',
            scope: 'reachable_component',
            start: startId,
            order: [...this.dfn],
        }
        return this.result
    }

    private dfs(u: NodeId, father: NodeId | null): void {
        this.visited.add(u)
        this.dfn.push(u)

        this.animation.push({
            edges_state: [],
            nodes_state: [
                { id: u, class: ['now_vis'] },
                ...this.dfn.filter((id) => id !== u).map((id) => ({ id, class: ['visited'] })),
            ],
            dfn: [...this.dfn],
            jump: this.jump('dfs_set_visited'),
            log: `dfs访问到点 ${u},设置为已访问`,
        })

        for (const edge of this.graph.getEdgesStartingFrom(u)) {
            const next = edge.target
            if (!this.graph.is_directed && next === father) continue

            const isBackEdge = this.visited.has(next)
            this.animation.push({
                edges_state: [{ source: u, target: next, class: isBackEdge ? ['back_ancestor'] : ['highlight'] }],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...this.dfn.map((id) => ({ id, class: ['visited'] })),
                ],
                dfn: [...this.dfn],
                jump: this.jump('dfs_check_edge'),
                log: isBackEdge
                    ? `通过边 <${u},${next}>, 点${next}已访问,是返祖边`
                    : `通过边 <${u},${next}>, 尝试走向点 ${next}`,
            })

            if (!isBackEdge) {
                this.dfs(next, u)
            }
        }
    }

    get_frame(index: number): DFSFrame {
        if (index <= 0) return emptyFrame()
        return this.animation.get(index - 1) || emptyFrame()
    }

    public get frame_cnt(): number { return this.animation.length }
}
