import {Graph, NodeId} from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'

type EdgeState = { source: NodeId; target: NodeId; class: string[] }
type NodeState = { id: NodeId; class: string[] }

type QueItem = [NodeId, number]  // [node, step]

type Frame = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: [number, number]
    que: QueItem[]
    head: QueItem | null
    log: string
}

export class BFS_SP {
    public graph: Graph
    private animation: Frame[]
    private jumpInfo: pointJumpType
    private queue: QueItem[]

    constructor() { this.graph = new Graph(); this.animation = []; this.jumpInfo = {}; this.queue = []; }

    clear() { this.animation = []; this.jumpInfo = {}; this.queue = []; }

    set_pointJumpInfo(jumpInfo: pointJumpType) { this.jumpInfo = jumpInfo }
    set_graph(graph: Graph) { this.graph = graph }

    run_bfs_sp(start: NodeId = 1) {
        let visited: NodeId[] = []
        this.queue.push([start, 0])
        visited.push(start)

        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: start, class: ['now_vis'] }],
            que: [...this.queue],
            head: null,
            jump: this.jumpInfo['bfs_init'] || [-1, -1],
            log: `将结点 ${start} 加入队列,距离为0`
        })

        while (this.queue.length > 0) {
            let [u, step] = this.queue.shift() as QueItem
            this.animation.push({
                edges_state: [],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...visited.map(v => ({ id: v, class: ['highlight'] }))
                ],
                que: [...this.queue],
                head: [u, step],
                jump: this.jumpInfo['que_pop'] || [-1, -1],
                log: `取出的队列头部元素为 ${u}, 距离为${step}`
            })

            let adjEdges = this.graph.getEdgesStartingFrom(u)
            for (let v_edge of adjEdges) {
                let v = v_edge.target
                if (visited.includes(v)) continue

                this.animation.push({
                    edges_state: [{ source: u, target: v, class: ['highlight'] }],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...visited.map(n => ({ id: n, class: ['highlight'] }))
                    ],
                    que: [...this.queue],
                    head: [u, step],
                    jump: this.jumpInfo['check_adj_edge'] || [-1, -1],
                    log: `通过边 <${u},${v}>, 访问点 ${v}, 距离为${step+1}`
                })

                this.queue.push([v, step + 1])
                visited.push(v)
                this.animation.push({
                    edges_state: [],
                    nodes_state: [
                        { id: v, class: ['visited'] },
                        { id: u, class: ['highlight'] },
                        ...visited.filter(n => n !== v && n !== u).map(n => ({ id: n, class: ['highlight'] }))
                    ],
                    que: [...this.queue],
                    head: [u, step],
                    jump: this.jumpInfo['que_push'] || [-1, -1],
                    log: `将结点 ${v} 加入队列,距离为${step+1}`
                })
            }
        }
    }

    get_frame(idx: number): Frame {
        if (idx <= 0) return { edges_state: [], nodes_state: [], que: [], head: null, jump: [-1,-1], log: '' }
        return this.animation[idx - 1]
    }

    public get frame_cnt() { return this.animation.length }
}
