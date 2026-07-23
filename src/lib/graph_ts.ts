import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

export type NodeId = number

export enum GraphType {
    digraph = 'digraph',
    undigraph = 'undigraph',
}

export type GraphReadResult =
    | { ok: true }
    | { ok: false; error: string }

export class Node {
    constructor(
        public _id: NodeId,
        public _label?: string,
    ) {}

    public get id(): NodeId {
        return this._id
    }

    public get label(): string {
        return this._label || this.id.toString()
    }

    name(): string {
        return this.label
    }
}

export class Edge {
    constructor(
        public source: NodeId,
        public target: NodeId,
        public weight: number,
    ) {}

    name(graphType: GraphType = GraphType.undigraph, withWeight = false): string {
        const arrow = graphType === GraphType.digraph ? ' -> ' : ' -- '
        let result = `${this.source}${arrow}${this.target}`
        if (withWeight) {
            result += ` [weight=${this.weight}]`
        }
        return result
    }
}

export class Graph {
    private adjacencyList = new Map<NodeId, Edge[]>()
    private nodes: Node[] = []
    private edges: Edge[] = []

    constructor(public graphType: GraphType = GraphType.undigraph) {}

    public get node_cnt(): number {
        return this.nodes.length
    }

    public get edge_cnt(): number {
        return this.edges.length
    }

    public get node_ids(): NodeId[] {
        return this.nodes.map((node) => node.id)
    }

    public get type(): GraphType {
        return this.graphType
    }

    public get is_directed(): boolean {
        return this.graphType === GraphType.digraph
    }

    public get is_undirected(): boolean {
        return this.graphType === GraphType.undigraph
    }

    public clear(): void {
        this.adjacencyList.clear()
        this.nodes = []
        this.edges = []
    }

    public hasVertex(vertex: NodeId): boolean {
        return this.adjacencyList.has(vertex)
    }

    public readFromString(input: string): GraphReadResult {
        const lines = input
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)

        if (lines.length === 0) {
            return { ok: false, error: '输入不能为空' }
        }

        const header = lines[0].split(/\s+/).map(Number)
        if (header.length !== 2 || !header.every(Number.isSafeInteger)) {
            return { ok: false, error: '首行必须包含整数 n 和 m' }
        }

        const [nodeCount, edgeCount] = header
        if (nodeCount < 0 || edgeCount < 0) {
            return { ok: false, error: '节点数和边数不能为负数' }
        }
        if (lines.length - 1 !== edgeCount) {
            return { ok: false, error: `声明了 ${edgeCount} 条边，实际读取到 ${lines.length - 1} 条` }
        }

        const parsedEdges: Array<[NodeId, NodeId, number]> = []
        const edgeKeys = new Set<string>()

        for (let index = 1; index < lines.length; index++) {
            const values = lines[index].split(/\s+/).map(Number)
            if ((values.length !== 2 && values.length !== 3) || !values.every(Number.isFinite)) {
                return { ok: false, error: `第 ${index + 1} 行必须是 u v 或 u v w` }
            }

            const [source, target, weight = 0] = values
            if (!Number.isSafeInteger(source) || !Number.isSafeInteger(target)) {
                return { ok: false, error: `第 ${index + 1} 行的节点 ID 必须是整数` }
            }
            if (source < 1 || source > nodeCount || target < 1 || target > nodeCount) {
                return { ok: false, error: `第 ${index + 1} 行的节点 ID 超出 1..${nodeCount}` }
            }
            if (source === target) {
                return { ok: false, error: `第 ${index + 1} 行包含自环 ${source} -> ${target}` }
            }

            const edgeKey = this.is_undirected
                ? `${Math.min(source, target)}:${Math.max(source, target)}`
                : `${source}:${target}`
            if (edgeKeys.has(edgeKey)) {
                return { ok: false, error: `第 ${index + 1} 行包含重复边 ${source} -> ${target}` }
            }
            edgeKeys.add(edgeKey)
            parsedEdges.push([source, target, weight])
        }

        this.clear()
        for (let vertex = 1; vertex <= nodeCount; vertex++) {
            this.addVertex(vertex)
        }
        for (const [source, target, weight] of parsedEdges) {
            this.addEdge(source, target, weight)
        }
        return { ok: true }
    }

    public readFromCytoscape(nodes: NodeDefinition[], edges: EdgeDefinition[]): void {
        const nodeIds = nodes.map((node) => Number(node.data.id))
        if (nodeIds.some((id) => !Number.isSafeInteger(id))) {
            throw new Error('Cytoscape 节点 ID 必须是整数')
        }

        const parsedEdges = edges.map((edge) => ({
            source: Number(edge.data.source),
            target: Number(edge.data.target),
            weight: Number(edge.data.weight || 0),
        }))
        if (parsedEdges.some((edge) =>
            !Number.isSafeInteger(edge.source)
            || !Number.isSafeInteger(edge.target)
            || !Number.isFinite(edge.weight)
        )) {
            throw new Error('Cytoscape 边数据无效')
        }

        this.clear()
        for (const nodeId of nodeIds) {
            this.addVertex(nodeId)
        }
        for (const edge of parsedEdges) {
            this.addEdge(edge.source, edge.target, edge.weight)
        }
    }

    public addVertex(vertex: NodeId, label?: string): void {
        if (!Number.isSafeInteger(vertex)) {
            throw new Error(`节点 ID 必须是整数: ${vertex}`)
        }
        if (!this.adjacencyList.has(vertex)) {
            this.nodes.push(new Node(vertex, label))
            this.adjacencyList.set(vertex, [])
        }
    }

    public addEdge(source: NodeId, destination: NodeId, weight = 0): void {
        if (!Number.isFinite(weight)) {
            throw new Error(`边权必须是有限数字: ${weight}`)
        }

        this.addVertex(source)
        this.addVertex(destination)
        this.edges.push(new Edge(source, destination, weight))
        this.addAdjacencyEdge(source, destination, weight)
        if (this.is_undirected) {
            this.addAdjacencyEdge(destination, source, weight)
        }
    }

    private addAdjacencyEdge(source: NodeId, destination: NodeId, weight: number): void {
        this.adjacencyList.get(source)?.push(new Edge(source, destination, weight))
    }

    public getEdgesStartingFrom(vertex: NodeId): Edge[] {
        return this.adjacencyList.get(vertex) || []
    }

    public getNeighbors(vertex: NodeId): NodeId[] {
        return this.getEdgesStartingFrom(vertex).map((edge) => edge.target)
    }

    public graph_text_data(): string {
        const withWeights = this.edges.some((edge) => edge.weight !== 0)
        const lines = this.edges.map((edge) => withWeights
            ? `${edge.source} ${edge.target} ${edge.weight}`
            : `${edge.source} ${edge.target}`)
        return [`${this.node_cnt} ${this.edge_cnt}`, ...lines].join('\n')
    }

    public getAllDegree(): Record<NodeId, number> {
        const degrees: Record<NodeId, number> = {}
        for (const [vertex, edges] of this.adjacencyList) {
            degrees[vertex] = edges.length
        }
        return degrees
    }

    public getFirstVertex(): NodeId | undefined {
        if (this.nodes.length === 0) {
            return undefined
        }
        return Math.min(...this.node_ids)
    }

    private removeAdjacencyEdge(source: NodeId, destination: NodeId): boolean {
        const edges = this.adjacencyList.get(source)
        if (!edges) {
            return false
        }
        const index = edges.findIndex((edge) => edge.target === destination)
        if (index === -1) {
            return false
        }
        edges.splice(index, 1)
        return true
    }

    public removeEdge(source: NodeId, destination: NodeId): boolean {
        const edgeIndex = this.edges.findIndex((edge) => this.is_undirected
            ? (edge.source === source && edge.target === destination)
                || (edge.source === destination && edge.target === source)
            : edge.source === source && edge.target === destination)

        if (edgeIndex === -1) {
            return false
        }

        this.edges.splice(edgeIndex, 1)
        this.removeAdjacencyEdge(source, destination)
        if (this.is_undirected) {
            this.removeAdjacencyEdge(destination, source)
        }
        return true
    }

    public removeVertex(vertex: NodeId): boolean {
        if (!this.adjacencyList.has(vertex)) {
            return false
        }

        this.adjacencyList.delete(vertex)
        this.nodes = this.nodes.filter((node) => node.id !== vertex)
        this.edges = this.edges.filter((edge) => edge.source !== vertex && edge.target !== vertex)
        for (const [source, edges] of this.adjacencyList) {
            this.adjacencyList.set(source, edges.filter((edge) => edge.target !== vertex))
        }
        return true
    }

    public get all_nodes(): NodeDefinition[] {
        return this.nodes.map((node) => ({
            data: {
                id: node.id.toString(),
                ...(node._label ? { label: node._label } : {}),
            },
        }))
    }

    public get all_edges(): EdgeDefinition[] {
        return this.edges.map((edge) => ({
            data: {
                source: edge.source.toString(),
                target: edge.target.toString(),
                weight: edge.weight,
            },
        }))
    }
}

export function randomRange(left: number, right: number): number {
    return Math.floor(Math.random() * (right - left + 1)) + left
}

export function generateGraphByNodeAndEdgeCount(
    numNodes: number,
    numEdges: number,
): { nodes: NodeDefinition[]; edges: EdgeDefinition[] } {
    if (!Number.isSafeInteger(numNodes) || !Number.isSafeInteger(numEdges)) {
        throw new Error('节点数和边数必须是整数')
    }
    if (numNodes < 0 || numEdges < 0) {
        throw new Error('节点数和边数不能为负数')
    }

    const minimumEdgeCount = numNodes <= 1 ? 0 : numNodes - 1
    const maximumEdgeCount = numNodes * (numNodes - 1) / 2
    if (numEdges < minimumEdgeCount || numEdges > maximumEdgeCount) {
        throw new Error(`无法生成 ${numNodes} 个节点、${numEdges} 条边的无向连通简单图`)
    }

    const nodes: NodeDefinition[] = Array.from({ length: numNodes }, (_, index) => ({
        data: { id: String(index + 1) },
    }))
    const edges: EdgeDefinition[] = []
    const edgeKeys = new Set<string>()

    const addEdge = (source: number, target: number) => {
        const key = `${Math.min(source, target)}:${Math.max(source, target)}`
        edgeKeys.add(key)
        edges.push({ data: { source: String(source), target: String(target) } })
    }

    for (let vertex = 2; vertex <= numNodes; vertex++) {
        addEdge(vertex, randomRange(1, vertex - 1))
    }

    const candidates: Array<[number, number]> = []
    for (let source = 1; source <= numNodes; source++) {
        for (let target = source + 1; target <= numNodes; target++) {
            if (!edgeKeys.has(`${source}:${target}`)) {
                candidates.push([source, target])
            }
        }
    }
    for (let index = candidates.length - 1; index > 0; index--) {
        const targetIndex = randomRange(0, index)
        ;[candidates[index], candidates[targetIndex]] = [candidates[targetIndex], candidates[index]]
    }

    const additionalEdgeCount = numEdges - minimumEdgeCount
    for (const [source, target] of candidates.slice(0, additionalEdgeCount)) {
        addEdge(source, target)
    }

    return { nodes, edges }
}
