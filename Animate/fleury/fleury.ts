import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult, EdgeState } from '../../src/animation/animationTypes'

type EulerEdge = {
    id: number
    source: NodeId
    target: NodeId
}

export type FleuryFrameStatus = 'running' | 'complete' | 'empty' | 'invalid' | 'no_euler_trail'

export type FleuryFrame = AnimationFrame<FleuryFrameStatus> & {
    path: NodeId[]
    current: NodeId | null
    status: FleuryFrameStatus
    log: string
}

export type FleuryResult = AnimationResult<'complete' | 'empty' | 'invalid_start' | 'invalid_graph' | 'no_euler_trail', {
    start: NodeId | null
    path: NodeId[]
    edges: Array<[NodeId, NodeId]>
}>

const emptyFrame = (): FleuryFrame => ({
    edges_state: [],
    nodes_state: [],
    jump: [-1, -1],
    path: [],
    current: null,
    status: 'empty',
    log: '',
})

export class fleury {
    private graph: Graph = new Graph()
    private animation: FleuryFrame[] = []
    private jumpInfo: pointJumpType = {}
    private allEdges: EulerEdge[] = []
    private remainingEdges: EulerEdge[] = []
    private removedEdges: EulerEdge[] = []
    private path: NodeId[] = []
    private traversedEdges: Array<[NodeId, NodeId]> = []
    private result: FleuryResult | null = null

    clear(): void {
        this.animation = []
        this.allEdges = []
        this.remainingEdges = []
        this.removedEdges = []
        this.path = []
        this.traversedEdges = []
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }

    set_graph(graph: Graph): void {
        this.graph = graph
        this.clear()
        this.allEdges = graph.all_edges.map((edge, id) => ({
            id,
            source: Number(edge.data.source),
            target: Number(edge.data.target),
        }))
        this.remainingEdges = [...this.allEdges]
    }

    get_result(): FleuryResult | null { return this.result }

    run(start?: NodeId): FleuryResult {
        this.resetRunState()
        const nodeIds = this.graph.node_ids
        const startId = start ?? null

        if (this.graph.is_directed) {
            return this.finishFailure('invalid_graph', startId, 'Fleury 算法只支持无向图')
        }

        if (nodeIds.length === 0) {
            const result: FleuryResult = {
                status: 'empty',
                start: null,
                path: [],
                edges: [],
            }
            this.result = result
            this.animation.push(emptyFrame())
            return result
        }

        const degrees = this.getDegrees(this.remainingEdges)
        const nonIsolated = nodeIds.filter((nodeId) => (degrees.get(nodeId) ?? 0) > 0)
        const oddNodes = nonIsolated.filter((nodeId) => (degrees.get(nodeId) as number) % 2 === 1)
        const defaultStart = oddNodes[0] ?? nonIsolated[0] ?? this.graph.getFirstVertex() as NodeId
        const chosenStart = start ?? defaultStart

        if (!this.graph.hasVertex(chosenStart)) {
            return this.finishFailure('invalid_start', chosenStart, `起点 ${chosenStart} 不存在`)
        }
        if (this.remainingEdges.length > 0 && (degrees.get(chosenStart) ?? 0) === 0) {
            return this.finishFailure('invalid_start', chosenStart, `起点 ${chosenStart} 没有连接边`)
        }
        if (!this.isNonIsolatedConnected(nonIsolated, this.remainingEdges)) {
            return this.finishFailure('no_euler_trail', chosenStart, '图中的非孤立节点不连通，无欧拉迹')
        }
        if (oddNodes.length > 2) {
            return this.finishFailure('no_euler_trail', chosenStart, '图中奇度节点超过 2 个，无欧拉迹')
        }

        this.path = [chosenStart]
        this.pushFrame({
            status: 'running',
            current: chosenStart,
            jump: this.jump('find start point'),
            log: `寻找度为奇数点，起点为 ${chosenStart}`,
        })
        this.pushFrame({
            status: 'running',
            current: chosenStart,
            jump: this.jump('check odd_deg_cnt'),
            log: `图中奇度节点为 ${oddNodes.length} 个，小于等于 2，有欧拉迹`,
        })

        let current = chosenStart
        while ((this.getDegrees(this.remainingEdges).get(current) ?? 0) > 0) {
            const bridges = this.findBridges(this.remainingEdges)
            const candidates = this.remainingEdges.filter((edge) => edge.source === current || edge.target === current)
            const selected = candidates.find((edge) => !bridges.has(edge.id)) ?? candidates[0]

            if (!selected) {
                return this.finishFailure('no_euler_trail', chosenStart, `节点 ${current} 仍有未处理边，但没有可行的下一条边`)
            }

            const next = selected.source === current ? selected.target : selected.source
            this.pushFrame({
                status: 'running',
                current: next,
                jump: this.jump('fleury_find_next'),
                edges: this.getEdgeState(bridges, selected.id),
                log: `重新判断剩余图中的桥，优先选择 ${current} 到 ${next} 的非桥边`,
            })

            this.remainingEdges = this.remainingEdges.filter((edge) => edge.id !== selected.id)
            this.removedEdges.push(selected)
            this.traversedEdges.push([current, next])
            this.path.push(next)
            this.pushFrame({
                status: 'running',
                current: next,
                jump: this.jump('deal with edge'),
                edges: this.getEdgeState(this.findBridges(this.remainingEdges)),
                log: `删除 ${current} 到 ${next} 的边，移动到节点 ${next}`,
            })
            current = next
        }

        if (this.traversedEdges.length !== this.allEdges.length) {
            return this.finishFailure('no_euler_trail', chosenStart, '没有遍历完所有边，无欧拉迹')
        }

        const result: FleuryResult = {
            status: 'complete',
            start: chosenStart,
            path: [...this.path],
            edges: this.traversedEdges.map(([source, target]) => [source, target]),
        }
        this.result = result
        this.pushFrame({
            status: 'complete',
            current,
            edges: this.getEdgeState(new Set()),
            jump: [-1, -1],
            log: `欧拉迹完成，共经过 ${result.edges.length} 条边`,
        })
        return result
    }

    private resetRunState(): void {
        this.animation = []
        this.remainingEdges = [...this.allEdges]
        this.removedEdges = []
        this.path = []
        this.traversedEdges = []
        this.result = null
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    private getDegrees(edges: EulerEdge[]): Map<NodeId, number> {
        const degrees = new Map<NodeId, number>(this.graph.node_ids.map((nodeId) => [nodeId, 0]))
        for (const edge of edges) {
            degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1)
            degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1)
        }
        return degrees
    }

    private isNonIsolatedConnected(nonIsolated: NodeId[], edges: EulerEdge[]): boolean {
        if (nonIsolated.length <= 1) return true
        const adjacency = this.buildAdjacency(edges)
        const visited = new Set<NodeId>()
        const queue = [nonIsolated[0]]
        visited.add(nonIsolated[0])
        while (queue.length > 0) {
            const current = queue.shift() as NodeId
            for (const edge of adjacency.get(current) ?? []) {
                const next = edge.source === current ? edge.target : edge.source
                if (!visited.has(next)) {
                    visited.add(next)
                    queue.push(next)
                }
            }
        }
        return nonIsolated.every((nodeId) => visited.has(nodeId))
    }

    private buildAdjacency(edges: EulerEdge[]): Map<NodeId, EulerEdge[]> {
        const adjacency = new Map<NodeId, EulerEdge[]>()
        for (const nodeId of this.graph.node_ids) adjacency.set(nodeId, [])
        for (const edge of edges) {
            adjacency.get(edge.source)?.push(edge)
            adjacency.get(edge.target)?.push(edge)
        }
        return adjacency
    }

    private findBridges(edges: EulerEdge[]): Set<number> {
        const adjacency = this.buildAdjacency(edges)
        const dfn = new Map<NodeId, number>()
        const low = new Map<NodeId, number>()
        const bridges = new Set<number>()
        let time = 0

        const visit = (current: NodeId, parentEdge: number | null): void => {
            time += 1
            dfn.set(current, time)
            low.set(current, time)
            for (const edge of adjacency.get(current) ?? []) {
                if (edge.id === parentEdge) continue
                const next = edge.source === current ? edge.target : edge.source
                if (!dfn.has(next)) {
                    visit(next, edge.id)
                    low.set(current, Math.min(low.get(current) as number, low.get(next) as number))
                    if ((low.get(next) as number) > (dfn.get(current) as number)) bridges.add(edge.id)
                } else {
                    low.set(current, Math.min(low.get(current) as number, dfn.get(next) as number))
                }
            }
        }

        for (const nodeId of this.graph.node_ids) {
            if (!dfn.has(nodeId) && (adjacency.get(nodeId)?.length ?? 0) > 0) visit(nodeId, null)
        }
        return bridges
    }

    private getEdgeState(bridges: Set<number>, selectedId?: number): EdgeState[] {
        const removedOrder = new Map(this.removedEdges.map((edge, index) => [edge.id, index + 1]))
        return this.allEdges.map((edge) => {
            const classes: string[] = []
            const dfn = removedOrder.get(edge.id)
            if (dfn !== undefined) classes.push('del')
            else if (bridges.has(edge.id)) classes.push('cut_edge')
            if (selectedId === edge.id) classes.push('highlight')
            return {
                source: edge.source,
                target: edge.target,
                class: classes,
                ...(dfn !== undefined ? { dfn } : {}),
            }
        })
    }

    private pushFrame(options: {
        status: FleuryFrameStatus
        current: NodeId | null
        jump: [number, number]
        log: string
        edges?: EdgeState[]
    }): void {
        this.animation.push({
            edges_state: options.edges ?? this.getEdgeState(new Set()),
            nodes_state: options.current === null ? [] : [{ id: options.current, class: ['highlight'] }],
            jump: options.jump,
            path: [...this.path],
            current: options.current,
            status: options.status,
            log: options.log,
        })
    }

    private finishFailure(
        status: 'invalid_start' | 'invalid_graph' | 'no_euler_trail',
        start: NodeId | null,
        error: string,
    ): FleuryResult {
        const result: FleuryResult = {
            status,
            start,
            path: [],
            edges: [],
            error,
        }
        this.result = result
        this.animation.push({
            ...emptyFrame(),
            status: status === 'no_euler_trail' ? 'no_euler_trail' : 'invalid',
            current: start,
            nodes_state: start === null ? [] : [{ id: start, class: ['highlight'] }],
            jump: this.jump('check odd_deg_cnt'),
            log: error,
        })
        return result
    }

    get_frame(index: number): FleuryFrame {
        if (index <= 0) return emptyFrame()
        return this.animation[index - 1] || emptyFrame()
    }

    public get frame_cnt(): number { return this.animation.length }
}
