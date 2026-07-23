import { describe, expect, it } from 'vitest'
import {
    animationClasses,
    changedAnimationStateKeys,
    type AnimationVisualState,
} from '../src/animation/useCytoscapeRenderer'

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

describe('Cytoscape animation state diff', () => {
    it('returns only added, removed, or changed elements', () => {
        const previous = new Map<string, AnimationVisualState>([
            ['same', { class: ['visited'] }],
            ['changed', { class: ['visited'] }],
            ['removed', { class: ['highlight'] }],
        ])
        const next = new Map<string, AnimationVisualState>([
            ['same', { class: ['visited'] }],
            ['changed', { class: ['now_vis'] }],
            ['added', { class: ['highlight'], color: '#0f0' }],
        ])

        expect(changedAnimationStateKeys(previous, next)).toEqual(['changed', 'removed', 'added'])
    })
})
