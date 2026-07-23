import {Graph, NodeId} from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'

type EdgeState = { source: NodeId; target: NodeId; class: string[] }
type NodeState = { id: NodeId; class: string[] }

type Frame = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: [number, number]
    dfn: number[]
    low: number[]
    dfs_time: number
    cut_nodes: NodeId[]
    log: string
}

export class TarjanCut {
    public graph: Graph
    private animation: Frame[]
    private jumpInfo: pointJumpType
    private dfn: number[]
    private low: number[]
    private dfs_time: number
    private visited: Set<NodeId>
    private cut_nodes: Set<NodeId>

    constructor() { 
        this.graph = new Graph()
        this.animation = []
        this.jumpInfo = {}
        this.dfn = []
        this.low = []
        this.dfs_time = 0
        this.visited = new Set()
        this.cut_nodes = new Set()
    }
    
    clear() { this.animation = []; this.jumpInfo = {}; this.dfn = []; this.low = []; this.dfs_time = 0; this.visited = new Set(); this.cut_nodes = new Set(); }
    
    set_pointJumpInfo(jumpInfo: pointJumpType) { this.jumpInfo = jumpInfo }
    set_graph(graph: Graph) { 
        this.graph = graph
        this.dfn = new Array(graph.node_cnt + 1).fill(0)
        this.low = new Array(graph.node_cnt + 1).fill(0)
    }

    run(start: NodeId = 1) {
        this._tarjan(start, 0)
    }

    private _tarjan(u: NodeId, fa: NodeId) {
        let child = 0
        this.dfs_time++
        this.dfn[u] = this.low[u] = this.dfs_time
        this.visited.add(u)

        this.animation.push({
            edges_state: [],
            nodes_state: [
                { id: u, class: ['now_vis'] },
                ...Array.from(this.visited).filter(v => v !== u).map(v => ({ id: v, class: ['visited'] }))
            ],
            dfn: [...this.dfn],
            low: [...this.low],
            dfs_time: this.dfs_time,
            cut_nodes: [...this.cut_nodes],
            jump: this.jumpInfo['tarjan_enter'] || [-1, -1],
            log: `tarjan访问到点 ${u}, 设置dfn[${u}]=low[${u}]=${this.dfs_time}`
        })

        let adjEdges = this.graph.getEdgesStartingFrom(u)
        for (let edge of adjEdges) {
            let v = edge.target
            if (v === fa) {
                this.animation.push({
                    edges_state: [{ source: u, target: v, class: ['back_ancestor'] }],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['now_vis'] : ['visited'] }))
                    ],
                    dfn: [...this.dfn],
                    low: [...this.low],
                    dfs_time: this.dfs_time,
                    cut_nodes: [...this.cut_nodes],
                    jump: this.jumpInfo['tarjan_skip_parent'] || [-1, -1],
                    log: `${v} 是父亲,是树边,不走!`
                })
                continue
            }

            let isBackEdge = this.visited.has(v)
            this.animation.push({
                edges_state: [{ source: u, target: v, class: isBackEdge ? ['back_ancestor'] : ['highlight'] }],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['now_vis'] : ['visited'] }))
                ],
                dfn: [...this.dfn],
                low: [...this.low],
                dfs_time: this.dfs_time,
                cut_nodes: [...this.cut_nodes],
                jump: this.jumpInfo['tarjan_check_edge'] || [-1, -1],
                log: isBackEdge
                    ? `通过边 <${u},${v}>, 点${v}已访问,是返祖边`
                    : `通过边 <${u},${v}>, 走向点${v}`
            })

            if (isBackEdge) {
                let oldLow = this.low[u]
                this.low[u] = Math.min(this.low[u], this.dfn[v])
                this.animation.push({
                    edges_state: [],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['now_vis'] : ['visited'] }))
                    ],
                    dfn: [...this.dfn],
                    low: [...this.low],
                    dfs_time: this.dfs_time,
                    cut_nodes: [...this.cut_nodes],
                    jump: this.jumpInfo['tarjan_update_low_back'] || [-1, -1],
                    log: `用dfn[${v}]=${this.dfn[v]}更新点${u}的low值: ${oldLow} -> ${this.low[u]}`
                })
            } else {
                this._tarjan(v, u)
                child++

                let oldLow = this.low[u]
                this.low[u] = Math.min(this.low[u], this.low[v])
                this.animation.push({
                    edges_state: [],
                    nodes_state: [
                        { id: u, class: ['now_vis'] },
                        ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['now_vis'] : ['visited'] }))
                    ],
                    dfn: [...this.dfn],
                    low: [...this.low],
                    dfs_time: this.dfs_time,
                    cut_nodes: [...this.cut_nodes],
                    jump: this.jumpInfo['tarjan_update_low_child'] || [-1, -1],
                    log: `利用孩子${v},更新点${u}的low值: ${oldLow} -> ${this.low[u]}`
                })

                if (fa !== 0 && this.low[v] >= this.dfn[u]) {
                    this.cut_nodes.add(u)
                    this.animation.push({
                        edges_state: [],
                        nodes_state: [
                            { id: u, class: ['cut'] },
                            ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['cut'] : ['visited'] }))
                        ],
                        dfn: [...this.dfn],
                        low: [...this.low],
                        dfs_time: this.dfs_time,
                        cut_nodes: [...this.cut_nodes],
                        jump: this.jumpInfo['tarjan_cut_found'] || [-1, -1],
                        log: `${u}不是根,且子树${v}上的所有点都回不到点${u}的祖先点,${u}是割点`
                    })
                }
            }
        }

        if (fa === 0 && child > 1) {
            this.cut_nodes.add(u)
            this.animation.push({
                edges_state: [],
                nodes_state: [
                    { id: u, class: ['cut'] },
                    ...Array.from(this.visited).map(n => ({ id: n, class: n === u ? ['cut'] : ['visited'] }))
                ],
                dfn: [...this.dfn],
                low: [...this.low],
                dfs_time: this.dfs_time,
                cut_nodes: [...this.cut_nodes],
                jump: this.jumpInfo['tarjan_root_cut'] || [-1, -1],
                log: `${u}是根,且孩子的数量(${child})超过了1,${u}是割点`
            })
        }
    }

    get_frame(idx: number): Frame {
        if (idx <= 0) return { edges_state: [], nodes_state: [], dfn: [], low: [], dfs_time: 0, cut_nodes: [], jump: [-1,-1], log: '' }
        return this.animation[idx - 1]
    }

    public get frame_cnt() { return this.animation.length }
}
