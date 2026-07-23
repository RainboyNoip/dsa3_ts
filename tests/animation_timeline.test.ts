import { describe, expect, it } from 'vitest'
import type { AnimationFrame } from '../src/animation/animationTypes'
import { AnimationTimeline } from '../src/animation/animationTimeline'

const frame = (
    nodes_state: AnimationFrame['nodes_state'],
    edges_state: AnimationFrame['edges_state'],
    jump: number,
): AnimationFrame => ({
    nodes_state,
    edges_state,
    jump: [jump, jump + 1],
})

describe('AnimationTimeline', () => {
    it('reconstructs frames from patches and periodic checkpoints', () => {
        const timeline = new AnimationTimeline<AnimationFrame>(2)
        const frames = [
            frame(
                [{ id: 1, class: ['visited'] }],
                [{ source: 1, target: 2, class: ['highlight'] }],
                1,
            ),
            frame(
                [
                    { id: 1, class: ['visited'] },
                    { id: 2, class: ['now_vis'] },
                ],
                [{ source: 1, target: 2, class: ['tree'], dfn: 1 }],
                2,
            ),
            frame(
                [{ id: 2, class: ['now_vis', 'highlight'] }],
                [],
                3,
            ),
        ]

        for (const current of frames) timeline.push(current)

        expect(timeline.length).toBe(frames.length)
        expect(timeline.get(0)).toEqual(frames[0])
        expect(timeline.get(1)).toEqual(frames[1])
        expect(timeline.get(2)).toEqual(frames[2])
        expect(timeline.get(-1)).toBeUndefined()
        expect(timeline.get(3)).toBeUndefined()
    })

    it('preserves duplicate visual entries and their order', () => {
        const timeline = new AnimationTimeline<AnimationFrame>()
        const current = frame(
            [
                { id: 1, class: ['now_vis'] },
                { id: 1, class: ['highlight'] },
            ],
            [],
            1,
        )

        timeline.push(current)

        expect(timeline.get(0)?.nodes_state).toEqual(current.nodes_state)
    })
})
