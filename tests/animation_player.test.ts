import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAnimationPlayer } from '../src/animation/useAnimationPlayer'

afterEach(() => {
    vi.useRealTimers()
})

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

    it('plays one frame per interval and pauses at the end', () => {
        vi.useFakeTimers()
        const player = useAnimationPlayer(3, { intervalMs: 100 })

        player.play()
        expect(player.isPlaying.value).toBe(true)

        vi.advanceTimersByTime(100)
        expect(player.currentFrame.value).toBe(1)
        expect(player.isPlaying.value).toBe(true)

        vi.advanceTimersByTime(200)
        expect(player.currentFrame.value).toBe(3)
        expect(player.isAtEnd.value).toBe(true)
        expect(player.isPlaying.value).toBe(false)

        vi.advanceTimersByTime(500)
        expect(player.currentFrame.value).toBe(3)
    })

    it('supports pause, toggle, and restart without leaving a timer running', () => {
        vi.useFakeTimers()
        const player = useAnimationPlayer(4, { intervalMs: 100 })

        player.play()
        vi.advanceTimersByTime(100)
        player.pause()
        expect(player.currentFrame.value).toBe(1)
        expect(player.isPlaying.value).toBe(false)

        vi.advanceTimersByTime(500)
        expect(player.currentFrame.value).toBe(1)

        player.togglePlay()
        expect(player.isPlaying.value).toBe(true)
        vi.advanceTimersByTime(100)
        expect(player.currentFrame.value).toBe(2)

        player.restart()
        expect(player.currentFrame.value).toBe(0)
        expect(player.isPlaying.value).toBe(false)
        vi.advanceTimersByTime(500)
        expect(player.currentFrame.value).toBe(0)
    })

    it('stops playback when the frame count changes', () => {
        vi.useFakeTimers()
        const player = useAnimationPlayer(4, { intervalMs: 100 })

        player.play()
        player.setFrameCount(1)

        expect(player.currentFrame.value).toBe(0)
        expect(player.isPlaying.value).toBe(false)
        vi.advanceTimersByTime(500)
        expect(player.currentFrame.value).toBe(0)
    })
})
