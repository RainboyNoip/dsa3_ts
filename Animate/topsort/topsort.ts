import {Graph,NodeId} from '../../src/lib/graph_ts'
import {pointJumpType} from '../../src/lib/read_raw_code'

type EdgeState = {
    source: NodeId;
    target: NodeId;
    class: string[];
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
    que: number[], //队列的值
    top_sort: NodeId[]; //拓扑排序结果
    log: string;
}

export class topsort {
    public graph: Graph;
    private animation: Frame[];
    private jumpInfo: pointJumpType
    private in_degree: number[]; //入度
    private queue: NodeId[];
    private topsort_list : NodeId[]; //拓扑排序结果
    private del_edge: [NodeId,NodeId][];
    constructor() {
        this.graph= new Graph();
        this.animation = [];
        this.jumpInfo = {}
        this.topsort_list = [];
        this.del_edge = [];
        this.in_degree = []
        this.queue = []
    }
    
    clear(){
        this.animation = [];
        this.jumpInfo = {}
        this.topsort_list = [];
        this.del_edge = [];
        this.in_degree = []
        this.queue = []
    }

    set_pointJumpInfo( jumpInfo:pointJumpType ) { this.jumpInfo = jumpInfo }

    set_graph(graph: Graph) {
        this.graph = graph;
    }

    //得到节点的入度
    private get_in_degree() {
        this.in_degree = new Array(this.graph.node_cnt+1).fill(0);

        //遍历所有的边
        for( let edge of this.graph.all_edges){
            let target = edge.data.target;
            this.in_degree[Number(target)] += 1;
        }
        this.queue = [];
        for( let i=1; i<=this.graph.node_cnt; i++){
            if( this.in_degree[i] == 0 ){
                this.queue.push(i);
            }
        }
        // console.log('jumpinfo',this.jumpInfo)
        this.animation.push({
            edges_state: [],
            nodes_state: [],
            que: [...this.queue],
            top_sort: [],
            jump: this.jumpInfo['push zero in_deg point'],
            log: '把入度为0的点加入队列'
        })
    }

    //添加队列
    animate_push(log:string,now_vis_point: NodeId,jump:string) {
        this.animation.push({
            edges_state: this.del_edge.map((v) => ({ source: v[0], target: v[1], class: ['del'] })),
            nodes_state: [{ id: now_vis_point, class: ['now_vis'] }].concat(
                this.topsort_list.map((v) => ({ id: v, class: ['visited'] }))
            ),
            que: [...this.queue],
            top_sort: [...this.topsort_list],
            jump: this.jumpInfo[jump],
            log
        })
    }

    //进行拓扑排序
    run_top_sort() {
        this.get_in_degree();
        while( this.queue.length > 0 ) {
            // console.log(this.queue);
            let u = this.queue.shift() as NodeId;
            this.topsort_list.push(u);
            // console.log(this.topsort_list);
            this.animate_push('从队列中取出点: ' + u,u,'get u from que')

            for( let edge of this.graph.getEdgesStartingFrom(u) ){
                let v = edge.target;
                --this.in_degree[v];
                this.del_edge.push([u,v]);
                this.animate_push(`从点${u}中取出周围点${v},并减少入度1`,u,'get v from u')

                if( this.in_degree[v] == 0 ) {
                    this.queue.push(v);
                    this.animate_push(`点${v}的度为0,加入到队列`,u,'push v to que')
                }
            }
            // this.animation.push({
        }
    }

    get_frame(idx: number) {
        if( idx <= 0) return {
            edges_state: [],
            nodes_state: [],
            que: [],
            top_sort: [],
            jump: [-1,-1],
            log: ''
        }
        return this.animation[idx-1];
    }

    public get frame_cnt() {
        return this.animation.length;
    }
}