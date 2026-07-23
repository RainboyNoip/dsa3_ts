import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'

export type BFSFrame = AnimationFrame & {
    que: NodeId[]
    visited: NodeId[]
    head: NodeId | null
    poped: NodeId[]
    log: string
}

export type BFSResult = AnimationResult<'complete' | 'empty' | 'invalid_start', {
    scope: 'reachable_component'
    start: NodeId | null
    order: NodeId[]
}>

const emptyFrame = (): BFSFrame => ({
    edges_state: [],
    nodes_state: [],
    que: [],
    visited: [],
    head: null,
    poped: [],
    jump: [-1, -1],
    log: '',
})

export class BFS {
    public graph: Graph = new Graph()
    private animation = new AnimationTimeline<BFSFrame>()
    private jumpInfo: pointJumpType = {}
    private result: BFSResult | null = null

    clear(): void {
        this.animation.clear()
        this.jumpInfo = {}
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }

    set_graph(graph: Graph): void { this.graph = graph }

    set_frames(frames: readonly BFSFrame[]): void { this.animation.replace(frames) }

    get_result(): BFSResult | null { return this.result }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    run_bfs(start?: NodeId): BFSResult {
        this.animation.clear()
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

        const queue: NodeId[] = [startId]
        const visited = new Set<NodeId>([startId])
        const popped: NodeId[] = []
        const snapshot = () => [...visited]

        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: startId, class: ['now_vis'] }],
            que: [...queue],
            visited: snapshot(),
            head: null,
            poped: [...popped],
            jump: this.jump('bfs_init'),
            log: `将结点 ${startId} 加入队列,并设置为已访问`,
        })

        while (queue.length > 0) {
            const u = queue.shift() as NodeId
            popped.push(u)
            this.animation.push({
                edges_state: [],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...snapshot().map((id) => ({ id, class: ['highlight'] })),
                ],
                que: [...queue],
                visited: snapshot(),
                head: u,
                poped: [...popped],
                jump: this.jump('que_pop'),
                log: `取出的队列头部元素为 ${u}`,
            })

            for (const edge of this.graph.getEdgesStartingFrom(u)) {
                const next = edge.target
                if (visited.has(next)) continue

                this.animation.push({
                    edges_state: [{ source: u, target: next, class: ['highlight'] }],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...snapshot().map((id) => ({ id, class: ['highlight'] })),
                    ],
                    que: [...queue],
                    visited: snapshot(),
                    head: u,
                    poped: [...popped],
                    jump: this.jump('check_adj_edge'),
                    log: `通过边 <${u},${next}>, 访问点 ${next}`,
                })

                queue.push(next)
                visited.add(next)
                this.animation.push({
                    edges_state: [],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        { id: next, class: ['visited'] },
                        ...snapshot().filter((id) => id !== next).map((id) => ({ id, class: ['highlight'] })),
                    ],
                    que: [...queue],
                    visited: snapshot(),
                    head: u,
                    poped: [...popped],
                    jump: this.jump('que_push'),
                    log: `将结点 ${next} 加入队列,并设置为已访问`,
                })
            }

            this.animation.push({
                edges_state: [],
                nodes_state: [
                    { id: u, class: ['visited'] },
                    ...snapshot().filter((id) => id !== u).map((id) => ({ id, class: ['highlight'] })),
                ],
                que: [...queue],
                visited: snapshot(),
                head: null,
                poped: [...popped],
                jump: [-1, -1],
                log: `结点 ${u} 周围点已经全部访问完`,
            })
        }

        this.result = {
            status: 'complete',
            scope: 'reachable_component',
            start: startId,
            order: snapshot(),
        }
        return this.result
    }

    get_frame(index: number): BFSFrame {
        if (index <= 0) return emptyFrame()
        return this.animation.get(index - 1) || emptyFrame()
    }

    public get frame_cnt(): number { return this.animation.length }
}
