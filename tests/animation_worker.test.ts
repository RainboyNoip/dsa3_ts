import { describe, expect, it } from 'vitest'
import {
    ANIMATION_WORKER_EDGE_THRESHOLD,
    ANIMATION_WORKER_NODE_THRESHOLD,
    shouldUseAnimationWorker,
} from '../src/animation/animationWorkerClient'

describe('animation worker thresholds', () => {
    it('keeps small graphs on the synchronous path', () => {
        expect(shouldUseAnimationWorker(ANIMATION_WORKER_NODE_THRESHOLD - 1, ANIMATION_WORKER_EDGE_THRESHOLD - 1)).toBe(false)
    })

    it('offloads graphs that exceed either size threshold', () => {
        expect(shouldUseAnimationWorker(ANIMATION_WORKER_NODE_THRESHOLD, 0)).toBe(true)
        expect(shouldUseAnimationWorker(0, ANIMATION_WORKER_EDGE_THRESHOLD)).toBe(true)
    })
})
