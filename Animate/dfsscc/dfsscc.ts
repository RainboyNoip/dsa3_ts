import {Graph,NodeId} from '../../src/lib/graph_ts'
import {pointJumpType} from '../../src/lib/read_raw_code'

import randomColor from 'randomcolor'

type EdgeState = {
    source: NodeId;
    target: NodeId;
    class: string[];
}

type NodeState = {
    id: NodeId;
    class: string[];
    color: string;
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
    color: number[], //每个点的所属于的强连通分量的编号
    stack: number[] ,//栈上的点
    dfn: number[], //每个点的访问时间
    low: number[], //每个点的访问时间
    log: string;
}

export class Dfsscc {

    // private graph: Graph;
    private animation: Frame[];
    private visited: NodeId[]; //已经访问过的点
    private low: number[];
    private dfn: number[];
    private color : number[]; //每个点的所属于的强连通分量的编号
    private color_cnt :number;
    private time: number;
    private stack: NodeId[];
    private in_stack: Set<NodeId>;
    private all_edges: EdgeState[];
    private random_color_palette: string[]; //随机离散颜色
    constructor( 
        private graph: Graph,
        private jumpInfo: pointJumpType
    ) {
        this.animation = [];
        this.visited = [];
        this.time = 0;
        this.color_cnt = 0;
        this.in_stack = new Set();
        this.stack = []

        // 初始化dfn low color
        let node_size = this.graph.all_nodes.length
        this.dfn = new Array(node_size+1).fill(0);
        this.low = new Array(node_size+1).fill(0);
        this.color = new Array(node_size+1).fill(0);

        this.all_edges = this.graph.all_edges.map( e => ({ source: Number(e.data.source), target: Number(e.data.target), class: [] }) );

        this.random_color_palette = randomColor({count: node_size+1, luminosity: 'random', format: 'hex'})
    }

    private stack_push(u: NodeId): void {
        this.stack.push(u);
        this.in_stack.add(u);
    }

    private stack_pop(): NodeId {
        let u = this.stack.pop() as number;
        this.in_stack.delete(u);
        return u;
    }


    set_jumpInfo(jumpInfo: pointJumpType) {
        this.jumpInfo = jumpInfo;
    }

    set_graph( graph:Graph ):void {
        this.graph = graph;
    }

    private is_visited(u: NodeId): boolean {
        return this.visited.includes(u);
    }

    //1,2,3,4,5,6数字转成颜色
    number_to_color(n: number): string{
        return  this.random_color_palette[n];
    }

    push_animation(jump_name:string,log:string,now_u?: NodeId): void {

        this.animation.push({
            //deep clone
            edges_state: this.all_edges.map( e => ({ source: e.source, target: e.target, class: [...e.class] }) ),
            nodes_state: this.color.map( (v,idx)=> ({ id: idx, class: v >0 ? ["colored"] : [] , color: this.number_to_color(v)}) ) ,
            color:[...this.color],
            stack:[...this.stack],
            jump: this.jumpInfo[jump_name],
            low: [...this.low],
            dfn: [...this.dfn],
            log: log
        })

        if( now_u){
            this.animation[this.animation.length-1].nodes_state.push({ id: now_u, class: ["now_vis"] ,color: this.number_to_color(this.color[now_u])});
        }
    }

    set_edge_state(source: NodeId, target: NodeId, _class: string) {
        for (let e of this.all_edges) {
            if (e.source == source && e.target == target) {
                e.class = [_class];
                return;
            }
        }
    }

    //递归的执行
    __dfsscc(u: NodeId)
    {
        ++this.time;
        this.dfn[u] = this.time;
        this.low[u] = this.time;
        this.stack_push(u);
        this.visited.push(u);

        this.push_animation("set some value", `到达点${u},设置dfn,low,vis,stack`);

        for (let v of this.graph.getNeighbors(u)) {
            if( !this.is_visited(v) ) {
                this.set_edge_state(u,v,"tree");
                this.push_animation("not visited",`点${u}到达点${v},${v}没有被访问过,开始dfs`,u);
                this.__dfsscc(v);
                this.low[u] = Math.min(this.low[u],this.low[v]);
                this.push_animation("update_low_1",`用点${v}更新点${u}的low`,u);
            }
            else if( this.in_stack.has(v) ) {
                this.set_edge_state(u,v,"back_ancestor");
                this.low[u] = Math.min(this.low[u],this.dfn[v]);
                this.push_animation("update_low_2",`用dfn[${v}]更新点${u}的low`,u);
            }
            else {
                this.set_edge_state(u,v,"other");
            }
        }

        //dfs退出点u,进行强连通判断
        if( this.low[u] == this.dfn[u] ) {
            ++this.color_cnt;
            let t: number;
            do {
                t = this.stack_pop();
                this.color[t] = this.color_cnt;
                this.push_animation("set strong connected component",`点${t}的强连通分量编号为${this.color_cnt}`,u);
            } while (t != u);
        }
    }

    //运行后 得到强连通分量
    run_dfsscc(): void {

        for(let i = 1;i <= this.graph.node_cnt;i++) {
            if( !this.is_visited(i) ) {
                this.__dfsscc(i);
                this.push_animation("dfsscc_start",`点${i},没有被访问过,开始dfs`);
            }
        }
        for(let i =1;i<=this.graph.node_cnt;i++) {
            console.log(i,this.color[i]);
        }
    }

    get frame_cnt () {
        return this.animation.length;
    }

    get_frame(idx: number): Frame{
        if( idx <=0 ) {
            let node_size = this.graph.node_cnt;
            return {
                edges_state: [],
                nodes_state: [],
                color: new Array(node_size+1).fill(0),
                stack: [],
                jump: [-1,-1],
                dfn: new Array(node_size+1).fill(0),
                low: new Array(node_size+1).fill(0),
                log: ""
            }
        }

        return this.animation[idx-1];
        
    }
}