import { describe, expect, it } from 'vitest'
import { animationClasses } from '../src/animation/useCytoscapeRenderer'

describe('Cytoscape animation class whitelist', () => {
    it('covers every class emitted by the algorithm frame builders', () => {
        const emittedClasses = new Set([
            'highlight',
            'visited',
            'now_vis',
            'queued',
            'back_ancestor',
            'colored',
            'tree',
            'other',
            'cut_edge',
            'del',
            'cycle',
        ])

        expect(new Set(animationClasses)).toEqual(emittedClasses)
    })
})
