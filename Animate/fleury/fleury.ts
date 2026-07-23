// 根据 graph的数据生成 Fleury 算法动画

import {Graph,NodeId} from '../../src/lib/graph_ts'
import {pointJumpType} from '../../src/lib/read_raw_code'
// import {initCytoscape} from './cyto'

type EdgeState = {
    source: NodeId;
    target: NodeId;
    class: string[];
    dfn?: number; //边访问的顺序
}

type NodeState = {
    id: NodeId;
    class: string[];
}

// 一帧动
type Frame = {
    // cut_edges: [NodeId,NodeId][]; // cut_edge
    // visited: NodeId[]; //已经访问过的点
    // vertex: NodeId; //当前访问的节点
    // edge: [NodeId,NodeId]; //当前访问的边
    edges_state : EdgeState[]; //边状态
    nodes_state : NodeState[]; //点状态
    jump : [number,number]; //跳跃信息,
    log: string;
}

export class fleury {
    private graph: Graph;
    private animation: Frame[];
    private visited: NodeId[];
    private cut_edgs: [NodeId,NodeId][];
    private low: Map<NodeId,number>;
    private dfn: Map<NodeId,number>;
    private time: number
    private jumpInfo: pointJumpType //跳跃信息
    private removed_edges: [NodeId,NodeId][] //已经删除的边


    constructor() {
        this.graph= new Graph();
        this.animation = [];
        this.cut_edgs = [];
        this.visited = [] ; //存储已经访问过的点
        this.low = new Map();
        this.dfn = new Map();
        this.time = 0;
        this.removed_edges = [];
        this.jumpInfo = {}
    }
    clear() {
        this.animation = [];
        this.cut_edgs = [];
        this.visited = [] ; //存储已经访问过的点
        this.low = new Map();
        this.dfn = new Map();
        this.time = 0;
        this.removed_edges = [];
        this.jumpInfo = {}
    }

    set_pointJumpInfo( jumpInfo:pointJumpType ) { this.jumpInfo = jumpInfo }

    set_graph( graph:Graph ) { this.clear(); this.graph = graph }

    set_low(u:NodeId,val:number) {  this.low.set(u,val) }
    set_dfn(u:NodeId,val: number) {  this.dfn.set(u,val) }
    // 得到low列表
    get_low_list() { 
        let arr = new Array(this.graph.node_cnt+1).fill(0)
        for( let [key,val] of this.low.entries() )
        {
            arr[key] = val
        }
        return arr;
    }
    // 得到dfn列表
    get_dfn_list() {
        let arr = new Array(this.graph.node_cnt+1).fill(0)
        for( let [key,val] of this.dfn.entries() )
        {
            arr[key] = val
        }
        return arr;
    }

    //运行后得到边的 cut_edge
    trajan_cut_edge(u:NodeId,father:NodeId) {


        console.log('tarjan_cut_edge',u,father);
        this.visited.push(u);
        ++this.time;
        this.set_dfn(u,this.time);
        this.set_low(u,this.time);

        // 遍历u的所有邻接点
        for (let v of this.graph.getNeighbors(u)) {
            if( this.visited.includes(v) == false ) {
                this.trajan_cut_edge(v,u);
                this.set_low(u,Math.min(this.low.get(u) as number,this.low.get(v) as number));
                if( this.low.get(v) as number > (this.dfn.get(u) as number) ) {
                    this.cut_edgs.push([u,v]);
                }
            } 
            else if( v != father ) {
                this.set_low(u,Math.min(this.low.get(u) as number,this.dfn.get(v) as number) );
            }
        }
    }


    // 优先找到一个非 桥的边的点
    find_noncut_edge(vertex:NodeId) {

        let nodes = this.graph.getNeighbors(vertex);
        for(let node of nodes) {
            if( this.cut_edgs.includes([vertex,node]) == false ) {
                return node; //返回非桥的邻接点
            }
        }
        //如果没有非桥的边,则返回任意一个点
        return nodes[0];
    }


    //得到边的状态
    private get_edge_state() {
        //先存在cut_edge
        let state : EdgeState[] = this.cut_edgs.map(([u,v]) => ({source: u, target: v,class:['cut_edge']}));

        // 然后存其它边
        // let all_edges = this.graph.all_edges;
        // for( let [u,v] of all_edges ) {
        //     if( this.cut_edgs.includes([u,v]) == false ) {
        //         state.push({source: u, target: v,class:[]})
        //     }
        // }

        //添加删除的边
        let dfn_time = 0;
        for( let [u,v] of this.removed_edges ) {
            ++dfn_time;
            if( this.cut_edgs.includes([u,v]) ) {
                let e = state.find(({source,target}) => source == u && target == v) as EdgeState
                e.class.push('del')
                e.dfn = dfn_time;
            }
            else if( this.cut_edgs.includes([v,u]) ) {
                let e = state.find(({source,target}) => source == v && target == u) as EdgeState
                e.class.push('del')
                e.dfn = dfn_time;
            }
            else state.push({source: u, target: v,class:['del'] ,dfn: dfn_time})
        }


        return state
    }

    fleury() {
        //得到每个点的度
        let odd_deg_cnt = 0;
        let all_degree = this.graph.getAllDegree();
        let start = this.graph.getFirstVertex() as NodeId;
        console.log('start',start)
        for(let v in all_degree) {
            if( all_degree[v] % 2 == 1 ) {
                let __v = Number(v)
                if( start > __v ) {
                    start = __v; //找到一个最小的点
                }
                // start = Number(v); //设定起点
                odd_deg_cnt++;
            }
        }
        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: start,class:['highlight']}],
            jump: this.jumpInfo['find start point'],
            log: `寻找度为奇数点,起点为${start}`
        })

        if( odd_deg_cnt > 2 ) { // 奇度结点大于2,无欧拉迹
            console.log("no euler path");
            this.animation.push({
                edges_state: [],
                nodes_state: [{ id: start, class: ['highlight'] }],
                jump: this.jumpInfo['check odd_deg_cnt'],
                log: `图中奇度结点大于2,无欧拉迹`
            })
            throw("no euler path");
            return;
        }
        this.animation.push({
            edges_state: [],
            nodes_state: [{ id: start, class: ['highlight'] }],
            jump: this.jumpInfo['check odd_deg_cnt'],
            log: `图中奇度结点小于等于2,有欧拉迹`
        })
         
        while( all_degree[start] != 0) {

            let v = this.find_noncut_edge(start);
            this.animation.push({
                edges_state: this.get_edge_state(),
                nodes_state: [{ id: v,class:['highlight']}],
                jump: this.jumpInfo['fleury_find_next'],
                log: `优先寻找${start}的非桥边,得到${v}`
            })
            console.log('-->',start,v);
            //删除边 
            this.graph.removeEdge(start,v);
            this.removed_edges.push([start,v]); //记录删除的边
            // this.dfn_edges.push([start,v]); //记录删除的边的访问序
            all_degree[start]--;
            all_degree[v]--;

            this.animation.push({
                edges_state: this.get_edge_state(),
                nodes_state: [{ id: v, class: ['highlight'] }],
                jump: this.jumpInfo['deal with edge'],
                log: `删除${start}到${v}的边`
            })

            start = v;
        }

    }

    run() {
        // let u = this.graph.getFirstVertex();
        let u = 1; // 这里固定从1开始,进行tarjan
        // console.log('first',u)
        if( !u ) {
            throw('图中没有点');
            return;
        }
        this.trajan_cut_edge(u,-1);
        this.animation.push({
            edges_state: this.get_edge_state(),
            nodes_state: [],
            // dfn_state: this.get_dfn_list(),
            // low_state: this.get_low_list(),
            jump: this.jumpInfo['tarjan_cut_edge'],
            log: `进行trajan_cut_edge(${u},-1),并求出对应的割边`
        });

        this.fleury();
    }

    get_frame(idx: number) {
        return this.animation[idx];
    }

    public get frame_cnt() {
        return this.animation.length;
    }

    //压缩前n个动画序列为一帧
    
    // compress( pre_n_frames :number) {
    // }

}
