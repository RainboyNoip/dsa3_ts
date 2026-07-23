//重写ts版本的 graph

import {NodeDefinition,EdgeDefinition} from 'cytoscape'

// graph 类,用于存图,对图进行一定的操作: 删除边,删除顶点,添加边,添加顶点,得到顶点的邻接点,得到顶所有点的度,得到第一个顶点,显示图的邻接表
// export namespace graph_ts {
export type NodeId = number

export enum GraphType {
    digraph = "digraph",
    undigraph = "undigraph"
}

export class Node {
    constructor(
        public _id: NodeId,
        public _label?: string
    ) { }

    public get id(): NodeId {
        return this._id
    }

    public get label(): string {
        return this.label || this.id.toString()
    }



    name(): string {
        return this.label || this.id.toString()
    }

}

// 定义边的结构
export class Edge {
    constructor(
        public source: NodeId, // 起始顶点
        public target: NodeId, // 目标顶点
        public weight: number, // 权值
    ) {
    }
    name(gt: GraphType = GraphType.undigraph, withWeight: boolean = false): string {
        let arrow = gt == GraphType.undigraph ? " -> " : " -- "
        let ret = `${this.source}${arrow}${this.target}`
        if (withWeight) {
            ret += ` [weight=${this.weight}]`
        }
        return ret
    }
}

// 定义图的结构
export class Graph {
    private adjacencyList: Map<NodeId, Edge[]>; // 邻接表
    private e_cnt = 0;
    private nodes: Node[] = []
    private edges: Edge[] = []

    constructor(
        public graphType: GraphType = GraphType.undigraph
    ) {
        this.adjacencyList = new Map();
    }

    public get node_cnt() :number {
        return this.nodes.length
    }
    public get edge_cnt() :number {
        return this.edges.length
    }

    public clear() :void {
        this.adjacencyList.clear()
        this.nodes = []
        this.edges = []
        this.e_cnt = 0
    }

    // 从字符串中读取图
    public readFromString(str: string): void {
        this.clear();
        let data = str.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => line.split(' '))
            .map(line => line.map(Number));
        let [n,m] = data[0]
        for(let i = 1;i<=n;i++) 
            this.addVertex(i)
        if( m != data.slice(1).length){
            alert('格式错误,m与边数不匹配')
            return
        }
        for( let [u,v,w] of data.slice(1)) {
            this.addEdge(u,v,w || 0)
        }
    }

    // 从cytoscape的节点和边中读取图
    public readFromCytoscape(nodes: NodeDefinition[], edges: EdgeDefinition[]): void {
        this.clear();
        for (let node of nodes) {
            this.addVertex(Number( node.data.id))
        }
        for (let edge of edges) {
            this.addEdge(Number(edge.data.source),Number(edge.data.target), edge.data.weight || 0)
        }
        // console.log(this.size)
        // console.log(this.getFirstVertex())
    }

    public get type(): GraphType {
        return this.graphType
    }

    public get is_directed(): boolean {
        return this.graphType == GraphType.digraph
    }

    public get is_undirected(): boolean {
        return this.graphType == GraphType.undigraph
    }

    // 添加顶点
    addVertex(vertex: NodeId): void {
        if (!this.adjacencyList.has(vertex)) {
            this.nodes.push(new Node(vertex))
            this.adjacencyList.set(vertex, []);
        }
    }

    // 添加边
    addEdge(source: NodeId, destination: NodeId, weight: number): void {
        // 确保源和目标顶点存在
        this.e_cnt++;
        this.edges.push(new Edge(source, destination, weight))
        this._addEdge(source, destination, weight)

        if (this.is_undirected) { //再调用一次,添加反向边
            this._addEdge(destination, source, weight)
        }
    }
    private _addEdge(source: NodeId, destination: NodeId, weight: number): void {
        if (!this.adjacencyList.has(source)) {
            this.addVertex(source);
        }
        const edge = new Edge(source, destination, weight);
        this.adjacencyList.get(source)?.push(edge);
    }

    // 获取一个顶点的所有邻接边
    getEdgesStartingFrom(vertex: NodeId): Edge[] {
        return this.adjacencyList.get(vertex) || [];
    }


    // 得到顶点的邻接点
    getNeighbors(vertex: NodeId): NodeId[] {
        return this.getEdgesStartingFrom(vertex).map(edge => edge.target);
    }

    // 打印图的信息（用于调试）
    printGraph(): void {
        //TODO
        // for (let [vertex, edges] of this.adjacencyList) {
        //     let edgeDescriptions = edges.map(e => `(${e.destination}, ${e.weight})`).join(' ');
        //     console.log(`${vertex} --> ${edgeDescriptions}`);
        // }
    }

    graph_text_data(): string {
        let ret = [this.adjacencyList.size, this.adjacencyList.size]
        return ret.join('\n')
    }


    //得到所有顶点的度
    getAllDegree(): { [key: NodeId]: number } {
        let all_degree: { [key: NodeId]: number } = {}
        for (let [vertex, edges] of this.adjacencyList) {
            all_degree[vertex] = edges.length
        }
        return all_degree
    }

    //得到最小的点
    getFirstVertex(): NodeId | undefined {
        let vertexIter = this.adjacencyList.keys()
        let first = vertexIter.next().value
        let next = vertexIter.next()
        while (!next.done) {
            if(first as NodeId > next.value)
                first = next.value
            next = vertexIter.next()
        }
        return first;
    }

    //删除边
    _removeEdge(source: NodeId, destination: NodeId): void {
        const edges = this.adjacencyList.get(source);
        if (edges) {
            const index = edges.findIndex(e => e.target === destination);
            if (index !== -1) {
                edges.splice(index, 1);
            }
        } else {
            console.warn(`No edge found from ${source} to ${destination}`);
        }
    }

    removeEdge(source: NodeId, destination: NodeId): void {
        this._removeEdge(source, destination)
        this.edges = this.edges.filter(e => !(e.source === source && e.target === destination))
        if (this.is_undirected) { //再调用一次,删除反向边
            // 在undirected graph 里虽然 edges 里只存一条边,但是我们也会正反的删除这条边
            // 为了不会少删除,这里再次过滤
            this.edges = this.edges.filter(e => !(e.source === destination && e.target === source))
            this._removeEdge(destination, source)
        }
    }

    //删除顶点
    removeVertex(vertex: NodeId): void {
        this.adjacencyList.delete(vertex);
        for (let edges of this.adjacencyList.values()) {
            edges.forEach(edge => {
                if (edge.target === vertex) {
                    const index = edges.indexOf(edge);
                    if (index !== -1) {
                        edges.splice(index, 1);
                    }
                }
            });
        }
    }

    get all_nodes(): NodeDefinition[] {
        let ret: NodeDefinition[] = []
        // console.log('00--> ',this.nodes)
        this.nodes.reduce(
            (acc, cur) => {
                acc.push({
                    data : {
                        id : cur.id.toString()
                    }
                })
                return acc
            }
        ,ret)
        return ret;
    }

    get all_edges(): EdgeDefinition[] {
        let ret: EdgeDefinition[] = []
        this.edges.reduce(
            (acc, cur) => {
                acc.push({
                    data : {
                        // id : cur.id.toString(),
                        source : cur.source.toString(),
                        target : cur.target.toString()
                    }
                })
                return acc
            }
        ,ret)
        return ret;
    }
}

export function randomRange(l: number, r: number): number {
    return Math.floor(Math.random() * (r - l + 1)) + l
}

/**
 * 根据点的数量和边的数量生成无向连通简单图
 * 前 n-1 条边构成一棵树，剩余边随机生成
 */
export function generateGraphByNodeAndEdgeCount(numNodes: number, numEdges: number): { nodes: { data: { id: string } }[], edges: { data: { source: string, target: string } }[] } {
    const nodes: { data: { id: string } }[] = []
    const edges: { data: { source: string, target: string } }[] = []

    for (let i = 1; i <= numNodes; i++) {
        nodes.push({ data: { id: i.toString() } })
    }

    const maxEdgeCount = numNodes * (numNodes - 1) / 2
    if (numEdges > maxEdgeCount) {
        throw new Error(`Cannot generate a graph with ${numNodes} nodes and ${numEdges} edges.`)
    }

    // 生成一棵树
    let edgeCount = numNodes - 1
    for (let i = 2; i <= numNodes; i++) {
        edges.push({
            data: { source: i.toString(), target: randomRange(1, i - 1).toString() }
        })
    }

    while (edgeCount < numEdges) {
        const source = randomRange(1, numNodes)
        const target = randomRange(1, numNodes)
        if (source === target) continue

        const existingEdge = edges.find(edge => (
            (edge.data.source === source.toString() && edge.data.target === target.toString()) ||
            (edge.data.source === target.toString() && edge.data.target === source.toString())
        ))

        if (!existingEdge) {
            edges.push({
                data: { source: source.toString(), target: target.toString() }
            })
            edgeCount++
        }
    }

    return { nodes, edges }
}

// 使用示例
// const graph = new Graph();
// graph.addEdge('A', 'B', 10);
// graph.addEdge('A', 'C', 5);
// graph.addEdge('B', 'C', 2);
// graph.addEdge('C', 'A', 1);

// graph.printGraph();

// } // end namespace Graph_ts