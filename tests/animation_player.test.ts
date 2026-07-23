import { describe, expect, it } from 'vitest'
import { useAnimationPlayer } from '../src/animation/useAnimationPlayer'

describe('useAnimationPlayer', () => {
    it('clamps navigation to the first and last frame', () => {
        const player = useAnimationPlayer(3)

        expect(player.currentFrame.value).toBe(0)
        expect(player.isAtStart.value).toBe(true)
        expect(player.progress.value).toBe(0)

        player.previousFrame()
        expect(player.currentFrame.value).toBe(0)

        player.nextFrame()
        player.nextFrame()
        player.nextFrame()
        player.nextFrame()
        expect(player.currentFrame.value).toBe(3)
        expect(player.isAtEnd.value).toBe(true)
        expect(player.progress.value).toBe(100)
    })

    it('normalizes counts and direct frame jumps', () => {
        const player = useAnimationPlayer()

        player.setFrameCount(4.8)
        player.setFrame(2.9)
        expect(player.currentFrame.value).toBe(2)
        expect(player.frameCount.value).toBe(4)

        player.setFrame(-10)
        expect(player.currentFrame.value).toBe(0)
        player.setFrame(Number.NaN)
        expect(player.currentFrame.value).toBe(0)

        player.setFrameCount(1)
        expect(player.currentFrame.value).toBe(0)
        player.setFrame(99)
        expect(player.currentFrame.value).toBe(1)
    })
})
