import {Graph, NodeId} from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'

type EdgeState = { source: NodeId; target: NodeId; class: string[] }
type NodeState = { id: NodeId; class: string[] }

type Frame = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: [number, number]
    que: NodeId[]
    visited: NodeId[]
    head: NodeId | null
    poped: NodeId[]
    log: string
}

export class BFS {
    public graph: Graph
    private animation: Frame[]
    private jumpInfo: pointJumpType
    private queue: NodeId[]
    private visited: NodeId[]
    private poped: NodeId[]

    constructor() {
        this.graph = new Graph();
        this.animation = [];
        this.jumpInfo = {};
        this.queue = [];
        this.visited = [];
        this.poped = [];
    }

    clear() {
        this.animation = [];
        this.jumpInfo = {};
        this.queue = [];
        this.visited = [];
        this.poped = [];
    }

    set_pointJumpInfo(jumpInfo: pointJumpType) { this.jumpInfo = jumpInfo }

    set_graph(graph: Graph) { this.graph = graph }

    run_bfs(start: NodeId = 1) {
        this.queue.push(start)
        this.visited.push(start)
        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: start, class: ['now_vis'] }],
            que: [...this.queue],
            visited: [...this.visited],
            head: null,
            poped: [...this.poped],
            jump: this.jumpInfo['bfs_init'] || [-1, -1],
            log: `将结点 ${start} 加入队列,并设置为已访问`
        })

        while (this.queue.length > 0) {
            let u = this.queue.shift() as NodeId
            this.poped.push(u)
            this.animation.push({
                edges_state: [],
                nodes_state: [{ id: u, class: ['now_vis'] },
                    ...this.visited.map(v => ({ id: v, class: ['highlight'] }))],
                que: [...this.queue],
                visited: [...this.visited],
                head: u,
                poped: [...this.poped],
                jump: this.jumpInfo['que_pop'] || [-1, -1],
                log: `取出的队列头部元素为 ${u}`
            })

            let adjEdges = this.graph.getEdgesStartingFrom(u)
            for (let edge of adjEdges) {
                let next = edge.target
                if (this.visited.includes(next)) continue

                this.animation.push({
                    edges_state: [{ source: u, target: next, class: ['highlight'] }],
                    nodes_state: [{ id: u, class: ['now_vis'] },
                        ...this.visited.map(v => ({ id: v, class: ['highlight'] }))],
                    que: [...this.queue],
                    visited: [...this.visited],
                    head: u,
                    poped: [...this.poped],
                    jump: this.jumpInfo['check_adj_edge'] || [-1, -1],
                    log: `通过边 <${u},${next}>, 访问点 ${next}`
                })

                this.queue.push(next)
                this.visited.push(next)
                this.animation.push({
                    edges_state: [],
                    nodes_state: [{ id: u, class: ['now_vis'] },
                        { id: next, class: ['visited'] },
                        ...this.visited.filter(v => v !== next).map(v => ({ id: v, class: ['highlight'] }))],
                    que: [...this.queue],
                    visited: [...this.visited],
                    head: u,
                    poped: [...this.poped],
                    jump: this.jumpInfo['que_push'] || [-1, -1],
                    log: `将结点 ${next} 加入队列,并设置为已访问`
                })
            }

            this.animation.push({
                edges_state: [],
                nodes_state: [{ id: u, class: ['visited'] },
                    ...this.visited.filter(v => v !== u).map(v => ({ id: v, class: ['highlight'] }))],
                que: [...this.queue],
                visited: [...this.visited],
                head: null,
                poped: [...this.poped],
                jump: [-1, -1],
                log: `结点 ${u} 周围点的已经全部访问完`
            })
        }
    }

    get_frame(idx: number) {
        if (idx <= 0) return {
            edges_state: [],
            nodes_state: [],
            que: [],
            visited: [],
            head: null,
            poped: [],
            jump: [-1, -1],
            log: ''
        }
        return this.animation[idx - 1]
    }

    public get frame_cnt() { return this.animation.length }
}
