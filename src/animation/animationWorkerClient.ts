import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { AnimationFrame } from './animationTypes'
import type { GraphType } from '../lib/graph_ts'
import type { pointJumpType } from '../lib/read_raw_code'
import type {
    AnimationWorkerAlgorithm,
    AnimationWorkerRequest,
    AnimationWorkerResponse,
} from './animationWorker'

export const ANIMATION_WORKER_NODE_THRESHOLD = 24
export const ANIMATION_WORKER_EDGE_THRESHOLD = 64

let nextRequestId = 0

export class AnimationWorkerError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AnimationWorkerError'
    }
}

export function isAnimationWorkerError(error: unknown): error is AnimationWorkerError {
    return error instanceof AnimationWorkerError
        || (typeof error === 'object'
            && error !== null
            && (error as { name?: unknown }).name === 'AnimationWorkerError')
}

export function shouldUseAnimationWorker(nodeCount: number, edgeCount: number): boolean {
    return nodeCount >= ANIMATION_WORKER_NODE_THRESHOLD
        || edgeCount >= ANIMATION_WORKER_EDGE_THRESHOLD
}

export function runAnimationInWorker<Frame extends AnimationFrame>(request: Omit<AnimationWorkerRequest, 'requestId'>): Promise<Frame[]> {
    if (typeof Worker === 'undefined') {
        return Promise.reject(new Error('当前浏览器不支持 Web Worker'))
    }

    const worker = new Worker(new URL('./algorithmWorker.ts', import.meta.url), { type: 'module' })
    const requestId = ++nextRequestId

    return new Promise<Frame[]>((resolve, reject) => {
        const finish = (): void => worker.terminate()
        worker.onmessage = (event: MessageEvent<AnimationWorkerResponse>): void => {
            const response = event.data
            if (response.requestId !== requestId) return
            finish()
            if (!response.ok) {
                reject(new AnimationWorkerError(response.error))
                return
            }
            resolve(response.frames as Frame[])
        }
        worker.onerror = (event): void => {
            finish()
            reject(new AnimationWorkerError(event.message || 'Web Worker 执行失败'))
        }
        worker.postMessage({ ...request, requestId } satisfies AnimationWorkerRequest)
    })
}

export type AnimationWorkerGraph = {
    graphType: GraphType
    nodes: NodeDefinition[]
    edges: EdgeDefinition[]
    jumpInfo: pointJumpType
    algorithm: AnimationWorkerAlgorithm
}
