import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'

type EdgeState = { source: NodeId; target: NodeId; class: string[] }
type NodeState = { id: NodeId; class: string[] }
type QueItem = [NodeId, number]

type Frame = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: [number, number]
    que: QueItem[]
    head: QueItem | null
    log: string
}

export type BFSShortestPathResult = {
    status: 'complete' | 'empty' | 'invalid_start'
    start: NodeId | null
    distances: Map<NodeId, number>
    predecessor: Map<NodeId, NodeId | null>
    error?: string
}

const emptyFrame = (): Frame => ({
    edges_state: [],
    nodes_state: [],
    que: [],
    head: null,
    jump: [-1, -1],
    log: '',
})

export class BFS_SP {
    public graph: Graph = new Graph()
    private animation: Frame[] = []
    private jumpInfo: pointJumpType = {}
    private result: BFSShortestPathResult | null = null

    clear(): void {
        this.animation = []
        this.jumpInfo = {}
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }
    set_graph(graph: Graph): void { this.graph = graph }
    get_result(): BFSShortestPathResult | null { return this.result }

    get_path(target: NodeId): NodeId[] {
        if (!this.result || this.result.status !== 'complete') return []
        if (!this.result.distances.has(target) || this.result.distances.get(target) === Infinity) return []

        const path: NodeId[] = []
        let current: NodeId | null = target
        while (current !== null) {
            path.push(current)
            current = this.result.predecessor.get(current) ?? null
        }
        return path.reverse()
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    run_bfs_sp(start?: NodeId): BFSShortestPathResult {
        this.animation = []
        const startId = start ?? this.graph.getFirstVertex() ?? null
        const distances = new Map<NodeId, number>(this.graph.node_ids.map((id) => [id, Infinity]))
        const predecessor = new Map<NodeId, NodeId | null>(this.graph.node_ids.map((id) => [id, null]))

        if (startId === null) {
            this.result = { status: 'empty', start: null, distances, predecessor }
            this.animation.push({ ...emptyFrame(), log: '图为空，没有可遍历的节点' })
            return this.result
        }
        if (!this.graph.hasVertex(startId)) {
            const error = `起点 ${startId} 不存在`
            this.result = {
                status: 'invalid_start',
                start: startId,
                distances,
                predecessor,
                error,
            }
            this.animation.push({ ...emptyFrame(), log: error })
            return this.result
        }

        const queue: QueItem[] = [[startId, 0]]
        const visited = new Set<NodeId>([startId])
        distances.set(startId, 0)
        const snapshotQueue = () => queue.map(([node, distance]) => [node, distance] as QueItem)
        const snapshotVisited = () => [...visited]

        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: startId, class: ['now_vis'] }],
            que: snapshotQueue(),
            head: null,
            jump: this.jump('bfs_init'),
            log: `将结点 ${startId} 加入队列,距离为0`,
        })

        while (queue.length > 0) {
            const [u, step] = queue.shift() as QueItem
            this.animation.push({
                edges_state: [],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...snapshotVisited().map((id) => ({ id, class: ['highlight'] })),
                ],
                que: snapshotQueue(),
                head: [u, step],
                jump: this.jump('que_pop'),
                log: `取出的队列头部元素为 ${u}, 距离为${step}`,
            })

            for (const edge of this.graph.getEdgesStartingFrom(u)) {
                const v = edge.target
                if (visited.has(v)) continue

                this.animation.push({
                    edges_state: [{ source: u, target: v, class: ['highlight'] }],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...snapshotVisited().map((id) => ({ id, class: ['highlight'] })),
                    ],
                    que: snapshotQueue(),
                    head: [u, step],
                    jump: this.jump('check_adj_edge'),
                    log: `通过边 <${u},${v}>, 访问点 ${v}, 距离为${step + 1}`,
                })

                visited.add(v)
                distances.set(v, step + 1)
                predecessor.set(v, u)
                queue.push([v, step + 1])
                this.animation.push({
                    edges_state: [],
                    nodes_state: [
                        { id: v, class: ['visited'] },
                        { id: u, class: ['highlight'] },
                        ...snapshotVisited()
                            .filter((id) => id !== v && id !== u)
                            .map((id) => ({ id, class: ['highlight'] })),
                    ],
                    que: snapshotQueue(),
                    head: [u, step],
                    jump: this.jump('que_push'),
                    log: `将结点 ${v} 加入队列,距离为${step + 1}`,
                })
            }
        }

        this.result = { status: 'complete', start: startId, distances, predecessor }
        return this.result
    }

    get_frame(index: number): Frame {
        if (index <= 0) return emptyFrame()
        return this.animation[index - 1] || emptyFrame()
    }

    public get frame_cnt(): number { return this.animation.length }
}
