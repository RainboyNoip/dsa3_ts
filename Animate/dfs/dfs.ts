import {Graph, NodeId} from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'

type EdgeState = { source: NodeId; target: NodeId; class: string[] }
type NodeState = { id: NodeId; class: string[] }

type Frame = {
    edges_state: EdgeState[]
    nodes_state: NodeState[]
    jump: [number, number]
    dfn: NodeId[]       // current dfs visited order
    log: string
}

export class DFS {
    public graph: Graph
    private animation: Frame[]
    private jumpInfo: pointJumpType
    private dfn: NodeId[]
    private visited: Set<NodeId>

    constructor() { this.graph = new Graph(); this.animation = []; this.jumpInfo = {}; this.dfn = []; this.visited = new Set(); }
    
    clear() { this.animation = []; this.jumpInfo = {}; this.dfn = []; this.visited = new Set(); }
    
    set_pointJumpInfo(jumpInfo: pointJumpType) { this.jumpInfo = jumpInfo }
    set_graph(graph: Graph) { this.graph = graph }

    run_dfs(start: NodeId = 1) {
        this._dfs(start, 0)
    }

    private _dfs(u: NodeId, father: NodeId) {
        this.visited.add(u)
        this.dfn.push(u)
        
        this.animation.push({
            edges_state: [],
            nodes_state: [
                { id: u, class: ['now_vis'] },
                ...this.dfn.filter(v => v !== u).map(v => ({ id: v, class: ['visited'] }))
            ],
            dfn: [...this.dfn],
            jump: this.jumpInfo['dfs_set_visited'] || [-1, -1],
            log: `dfs访问到点 ${u},设置为已访问`
        })

        let adjEdges = this.graph.getEdgesStartingFrom(u)
        for (let edge of adjEdges) {
            let next = edge.target
            if (next === father) continue  // skip parent edge
            
            let isBackEdge = this.visited.has(next)
            this.animation.push({
                edges_state: [{ source: u, target: next, class: isBackEdge ? ['back_ancestor'] : ['highlight'] }],
                nodes_state: [
                    { id: u, class: ['now_vis'] },
                    ...this.dfn.map(v => ({ id: v, class: ['visited'] }))
                ],
                dfn: [...this.dfn],
                jump: this.jumpInfo['dfs_check_edge'] || [-1, -1],
                log: isBackEdge 
                    ? `通过边 <${u},${next}>, 点${next}已访问,是返祖边` 
                    : `通过边 <${u},${next}>, 尝试走向点 ${next}`
            })

            if (!isBackEdge) {
                this._dfs(next, u)
            }
        }
    }

    get_frame(idx: number): Frame {
        if (idx <= 0) return { edges_state: [], nodes_state: [], dfn: [], jump: [-1,-1], log: '' }
        return this.animation[idx - 1]
    }

    public get frame_cnt() { return this.animation.length }
}
