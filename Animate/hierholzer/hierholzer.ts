import { Graph, NodeId } from '../../src/lib/graph_ts'
import { pointJumpType } from '../../src/lib/read_raw_code'
import type { AnimationFrame, AnimationResult, EdgeState, NodeState } from '../../src/animation/animationTypes'
import { AnimationTimeline } from '../../src/animation/animationTimeline'

type HierholzerEdge = {
    id: number
    source: NodeId
    target: NodeId
}

export type HierholzerFrameStatus = 'running' | 'complete' | 'empty' | 'invalid' | 'no_euler_trail'

export type HierholzerFrame = AnimationFrame<HierholzerFrameStatus> & {
    /** 当前模拟栈 stack_path，栈顶就是当前所在点 */
    stack: NodeId[]
    /** 已经收好的答案序列（构造过程中是后序，反转帧起是正序） */
    path: NodeId[]
    current: NodeId | null
    status: HierholzerFrameStatus
    log: string
}

export type HierholzerResult = AnimationResult<'complete' | 'empty' | 'invalid_start' | 'invalid_graph' | 'no_euler_trail', {
    start: NodeId | null
    /** 反转后的最终欧拉路（回路）顶点序列 */
    path: NodeId[]
    /** 反转前的后序序列，展示答案是逆序产生的 */
    rawPath: NodeId[]
    edges: Array<[NodeId, NodeId]>
    isCircuit: boolean
}>

const emptyFrame = (): HierholzerFrame => ({
    edges_state: [],
    nodes_state: [],
    jump: [-1, -1],
    stack: [],
    path: [],
    current: null,
    status: 'empty',
    log: '',
})

export class Hierholzer {
    private graph: Graph = new Graph()
    private animation = new AnimationTimeline<HierholzerFrame>()
    private jumpInfo: pointJumpType = {}
    private allEdges: HierholzerEdge[] = []
    private adjacency = new Map<NodeId, HierholzerEdge[]>()
    private result: HierholzerResult | null = null

    // 以下都是 run() 期间的运行状态
    private edgeUseOrder = new Map<number, number>()
    private collectedEdges = new Set<number>()
    private iter = new Map<NodeId, number>()
    private stack: NodeId[] = []
    private stackEdges: Array<number | null> = []
    private path: NodeId[] = []
    private current: NodeId | null = null

    clear(): void {
        this.animation.clear()
        this.allEdges = []
        this.adjacency = new Map()
        this.resetRunState()
        this.result = null
    }

    set_pointJumpInfo(jumpInfo: pointJumpType): void { this.jumpInfo = jumpInfo }

    set_frames(frames: readonly HierholzerFrame[]): void { this.animation.replace(frames) }

    set_graph(graph: Graph): void {
        this.graph = graph
        this.clear()
        this.allEdges = graph.all_edges.map((edge, id) => ({
            id,
            source: Number(edge.data.source),
            target: Number(edge.data.target),
        }))
        this.adjacency = this.buildAdjacency()
    }

    get_result(): HierholzerResult | null { return this.result }

    run(start?: NodeId): HierholzerResult {
        this.resetRunState()
        const nodeIds = this.graph.node_ids

        if (this.graph.is_directed) {
            return this.finishFailure('invalid_graph', null, 'Hierholzer 动画只支持无向图')
        }

        if (nodeIds.length === 0) {
            const result: HierholzerResult = {
                status: 'empty',
                start: null,
                path: [],
                rawPath: [],
                edges: [],
                isCircuit: false,
            }
            this.result = result
            this.animation.push(emptyFrame())
            return result
        }

        const degrees = this.getDegrees()
        const nonIsolated = nodeIds.filter((nodeId) => (degrees.get(nodeId) ?? 0) > 0)
        const oddNodes = nonIsolated.filter((nodeId) => (degrees.get(nodeId) as number) % 2 === 1)

        // 帧 1：统计度数，圈出所有奇度点
        this.pushFrame({
            status: 'running',
            jump: this.jump('find start point'),
            nodes: this.nodeStates({ colored: oddNodes }),
            log: `统计各点度数，奇度点有 ${oddNodes.length} 个${oddNodes.length > 0 ? `：${oddNodes.join('、')}` : ''}`,
        })

        // 帧 2：忽略孤立点，检查有边的点是否连通
        const visited = this.collectConnected(nonIsolated)
        this.pushFrame({
            status: 'running',
            jump: this.jump('check connected'),
            nodes: this.nodeStates({ visited: [...visited], colored: oddNodes }),
            log: `忽略孤立点，从 ${nonIsolated[0]} 出发能到达 ${visited.size}/${nonIsolated.length} 个有边的点`,
        })
        if (!nonIsolated.every((nodeId) => visited.has(nodeId))) {
            return this.finishFailure(
                'no_euler_trail',
                null,
                '有边的点不在同一个连通块内，无欧拉路',
                'check connected',
            )
        }

        // 帧 3：奇度点个数必须是 0 或 2，并据此选定起点
        if (oddNodes.length !== 0 && oddNodes.length !== 2) {
            return this.finishFailure(
                'no_euler_trail',
                null,
                `奇度点个数为 ${oddNodes.length}，不是 0 或 2，无欧拉路`,
                'check odd_deg_cnt',
                this.nodeStates({ colored: oddNodes }),
            )
        }

        const sortedOdd = [...oddNodes].sort((left, right) => left - right)
        const fallbackStart = [...nonIsolated].sort((left, right) => left - right)[0]
        const chosenStart = start ?? (sortedOdd[0] ?? fallbackStart as NodeId)

        if (!this.graph.hasVertex(chosenStart)) {
            return this.finishFailure('invalid_start', chosenStart, `起点 ${chosenStart} 不存在`)
        }
        if ((degrees.get(chosenStart) ?? 0) === 0) {
            return this.finishFailure('invalid_start', chosenStart, `起点 ${chosenStart} 没有连接边`)
        }

        this.pushFrame({
            status: 'running',
            current: chosenStart,
            jump: this.jump('check odd_deg_cnt'),
            nodes: this.nodeStates({ highlight: [chosenStart], colored: sortedOdd }),
            log: oddNodes.length === 2
                ? `奇度点为 ${sortedOdd.join('、')}，从奇度点 ${chosenStart} 出发`
                : `所有点都是偶度，从有边的点 ${chosenStart} 出发`,
        })

        // 帧 4 起：Hierholzer 主循环，沿未使用边前进，无路可走就弹栈收路
        this.current = chosenStart
        this.stack = [chosenStart]
        this.stackEdges = [null]

        while (this.stack.length > 0) {
            const u = this.stack[this.stack.length - 1] as NodeId
            const next = this.nextUnusedEdge(u)

            if (!next) {
                const popped = this.stack.pop() as NodeId
                const incoming = this.stackEdges.pop()
                if (incoming !== null && incoming !== undefined) this.collectedEdges.add(incoming)
                this.path.push(popped)
                this.current = this.stack.length > 0
                    ? this.stack[this.stack.length - 1] as NodeId
                    : null
                this.pushFrame({
                    status: 'running',
                    jump: this.jump('hierholzer pop'),
                    log: `点 ${popped} 没有未使用边了，弹栈收路：path = [${this.path.join(' ')}]`,
                })
                continue
            }

            const order = this.edgeUseOrder.size + 1
            const v = next.source === u ? next.target : next.source

            // 先展示选中的边（红色），压栈后才变成行进中的绿色边
            this.pushFrame({
                status: 'running',
                current: u,
                jump: this.jump('hierholzer step'),
                edges: this.getEdgeState(next.id),
                log: `从 ${u} 取第 ${order} 条未使用边 ${u}–${v}，压栈走到 ${v}`,
            })

            this.edgeUseOrder.set(next.id, order)
            this.stack.push(v)
            this.stackEdges.push(next.id)
            this.current = v
            this.pushFrame({
                status: 'running',
                current: v,
                jump: this.jump('hierholzer step'),
                log: `当前栈 stack_path = [${this.stack.join(' ')}]`,
            })
        }

        if (this.path.length !== this.allEdges.length + 1) {
            return this.finishFailure(
                'no_euler_trail',
                chosenStart,
                `只收集到 ${this.path.length} 个点，没有覆盖全部 ${this.allEdges.length} 条边，无欧拉路`,
                'reverse path',
            )
        }

        // 收尾：path 是后序产生的，反转一次才是欧拉路
        const rawPath = [...this.path]
        const finalPath = [...rawPath].reverse()
        const isCircuit = finalPath[0] === finalPath[finalPath.length - 1]
        const traversedEdges = this.getTraversedEdges()

        this.current = chosenStart
        this.pushFrame({
            status: 'running',
            current: chosenStart,
            jump: this.jump('reverse path'),
            log: `path 是后序产生的，反转得到欧拉${isCircuit ? '回路' : '路'}：${finalPath.join(' ')}`,
            displayPath: finalPath,
        })

        const result: HierholzerResult = {
            status: 'complete',
            start: chosenStart,
            path: finalPath,
            rawPath,
            edges: traversedEdges,
            isCircuit,
        }
        this.result = result
        this.pushFrame({
            status: 'complete',
            current: chosenStart,
            jump: [-1, -1],
            log: `欧拉${isCircuit ? '回路' : '路'}完成，共经过 ${traversedEdges.length} 条边`,
            displayPath: finalPath,
        })
        return result
    }

    private resetRunState(): void {
        this.animation.clear()
        this.edgeUseOrder = new Map()
        this.collectedEdges = new Set()
        this.iter = new Map()
        this.stack = []
        this.stackEdges = []
        this.path = []
        this.current = null
    }

    private jump(name: string): [number, number] {
        return this.jumpInfo[name] || [-1, -1]
    }

    private getDegrees(): Map<NodeId, number> {
        const degrees = new Map<NodeId, number>(this.graph.node_ids.map((nodeId) => [nodeId, 0]))
        for (const edge of this.allEdges) {
            degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1)
            degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1)
        }
        return degrees
    }

    private collectConnected(nonIsolated: NodeId[]): Set<NodeId> {
        const visited = new Set<NodeId>()
        const start = nonIsolated[0]
        if (start === undefined) return visited
        const queue = [start]
        visited.add(start)
        while (queue.length > 0) {
            const current = queue.shift() as NodeId
            for (const edge of this.adjacency.get(current) ?? []) {
                const next = edge.source === current ? edge.target : edge.source
                if (!visited.has(next)) {
                    visited.add(next)
                    queue.push(next)
                }
            }
        }
        return visited
    }

    private buildAdjacency(): Map<NodeId, HierholzerEdge[]> {
        const adjacency = new Map<NodeId, HierholzerEdge[]>()
        for (const nodeId of this.graph.node_ids) adjacency.set(nodeId, [])
        for (const edge of this.allEdges) {
            adjacency.get(edge.source)?.push(edge)
            if (edge.target !== edge.source) adjacency.get(edge.target)?.push(edge)
        }
        return adjacency
    }

    /** 对应 code.cpp 里的 while (ptr[u] < g[u].size() && used[...]) ptr[u]++ */
    private nextUnusedEdge(u: NodeId): HierholzerEdge | null {
        const list = this.adjacency.get(u) ?? []
        let pointer = this.iter.get(u) ?? 0
        while (pointer < list.length && this.edgeUseOrder.has((list[pointer] as HierholzerEdge).id)) {
            pointer += 1
        }
        this.iter.set(u, pointer)
        return pointer < list.length ? list[pointer] as HierholzerEdge : null
    }

    private getTraversedEdges(): Array<[NodeId, NodeId]> {
        return [...this.edgeUseOrder.entries()]
            .sort((left, right) => left[1] - right[1])
            .map(([edgeId]) => {
                const edge = this.allEdges[edgeId] as HierholzerEdge
                return [edge.source, edge.target] as [NodeId, NodeId]
            })
    }

    /** 显示优先级：当前点 > 栈上的点 > 已收路的点 > 奇度点 */
    private nodeStates(groups: {
        highlight?: NodeId[]
        queued?: NodeId[]
        visited?: NodeId[]
        colored?: NodeId[]
    }): NodeState[] {
        const states: NodeState[] = []
        const seen = new Set<NodeId>()
        const push = (ids: NodeId[] | undefined, className: string): void => {
            for (const id of ids ?? []) {
                if (seen.has(id)) continue
                seen.add(id)
                states.push({ id, class: [className] })
            }
        }
        push(groups.highlight, 'highlight')
        push(groups.queued, 'queued')
        push(groups.visited, 'visited')
        push(groups.colored, 'colored')
        return states
    }

    /** 已使用边标使用顺序；栈上的边是 highlight，收好的边是 visited */
    private getEdgeState(selectedId?: number): EdgeState[] {
        return this.allEdges.map((edge) => {
            const classes: string[] = []
            const order = this.edgeUseOrder.get(edge.id)
            if (order !== undefined) {
                classes.push(this.collectedEdges.has(edge.id) ? 'visited' : 'highlight')
            }
            if (selectedId === edge.id) classes.push('now_vis')
            return {
                source: edge.source,
                target: edge.target,
                class: classes,
                ...(order !== undefined ? { dfn: order } : {}),
            }
        })
    }

    private pushFrame(options: {
        status: HierholzerFrameStatus
        jump: [number, number]
        log: string
        current?: NodeId | null
        edges?: EdgeState[]
        nodes?: NodeState[]
        displayPath?: NodeId[]
    }): void {
        const current = options.current ?? this.current
        this.animation.push({
            edges_state: options.edges ?? this.getEdgeState(),
            nodes_state: options.nodes ?? this.nodeStates({
                ...(current === null ? {} : { highlight: [current] }),
                queued: [...this.stack],
                visited: [...this.path],
            }),
            jump: options.jump,
            stack: [...this.stack],
            path: options.displayPath ?? [...this.path],
            current,
            status: options.status,
            log: options.log,
        })
    }

    private finishFailure(
        status: 'invalid_start' | 'invalid_graph' | 'no_euler_trail',
        start: NodeId | null,
        error: string,
        jumpName = 'check odd_deg_cnt',
        nodes?: NodeState[],
    ): HierholzerResult {
        const result: HierholzerResult = {
            status,
            start,
            path: [],
            rawPath: [],
            edges: [],
            isCircuit: false,
            error,
        }
        this.result = result
        const highlight = start === null ? [] : [{ id: start, class: ['highlight'] }]
        this.animation.push({
            ...emptyFrame(),
            status: status === 'no_euler_trail' ? 'no_euler_trail' : 'invalid',
            current: start,
            nodes_state: nodes ? [...nodes, ...highlight] : highlight,
            jump: this.jump(jumpName),
            log: error,
        })
        return result
    }

    get_frame(index: number): HierholzerFrame {
        if (index <= 0) return emptyFrame()
        return this.animation.get(index - 1) || emptyFrame()
    }

    public get frame_cnt(): number { return this.animation.length }
}
