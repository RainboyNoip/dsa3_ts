import { Graph } from '../lib/graph_ts'
import { isAnimationBudgetExceeded, formatAnimationBudgetError } from './animationBudget'
import type { AnimationFrame } from './animationTypes'
import type {
    AnimationWorkerRequest,
    AnimationWorkerResponse,
} from './animationWorker'
import { BFS } from '../../Animate/bfs/bfs'
import { BFS_SP } from '../../Animate/bfs_shortest_path/bfs_sp'
import { DFS } from '../../Animate/dfs/dfs'
import { topsort } from '../../Animate/topsort/topsort'
import { Dfsscc } from '../../Animate/dfsscc/dfsscc'
import { TarjanCut } from '../../Animate/tarjan_cut/tarjan'
import { fleury } from '../../Animate/fleury/fleury'
import { Hierholzer } from '../../Animate/hierholzer/hierholzer'

type WorkerScope = {
    onmessage: ((event: MessageEvent<AnimationWorkerRequest>) => void) | null
    postMessage: (message: AnimationWorkerResponse) => void
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event): void => {
    const request = event.data
    try {
        const graph = new Graph(request.graphType)
        graph.readFromCytoscape(request.nodes, request.edges)
        const frames = runAlgorithm(request, graph)
        scope.postMessage({ requestId: request.requestId, ok: true, frames })
    } catch (error) {
        const message = isAnimationBudgetExceeded(error)
            ? formatAnimationBudgetError(error)
            : error instanceof Error ? error.message : 'Web Worker 执行失败'
        scope.postMessage({ requestId: request.requestId, ok: false, error: message })
    }
}

function runAlgorithm(request: AnimationWorkerRequest, graph: Graph): AnimationFrame[] {
    switch (request.algorithm) {
        case 'bfs': {
            const algorithm = new BFS()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run_bfs()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'bfs_shortest_path': {
            const algorithm = new BFS_SP()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run_bfs_sp()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'dfs': {
            const algorithm = new DFS()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run_dfs()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'topsort': {
            const algorithm = new topsort()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run_top_sort()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'dfsscc': {
            const algorithm = new Dfsscc(graph, request.jumpInfo)
            algorithm.run_dfsscc()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'tarjan_cut': {
            const algorithm = new TarjanCut()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'fleury': {
            const algorithm = new fleury()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
        case 'hierholzer': {
            const algorithm = new Hierholzer()
            algorithm.set_graph(graph)
            algorithm.set_pointJumpInfo(request.jumpInfo)
            algorithm.run()
            return readFrames(algorithm.frame_cnt, (index) => algorithm.get_frame(index))
        }
    }
}

function readFrames(count: number, getFrame: (index: number) => AnimationFrame): AnimationFrame[] {
    return Array.from({ length: count }, (_, index) => getFrame(index + 1))
}
