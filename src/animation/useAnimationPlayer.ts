import { computed, getCurrentScope, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'

export const DEFAULT_ANIMATION_INTERVAL_MS = 700

export type AnimationPlayerOptions = {
    intervalMs?: number
}

export type AnimationPlayer = {
    currentFrame: Ref<number>
    frameCount: ComputedRef<number>
    progress: ComputedRef<number>
    isAtStart: ComputedRef<boolean>
    isAtEnd: ComputedRef<boolean>
    isPlaying: Ref<boolean>
    setFrameCount: (count: number) => void
    setFrame: (frame: number) => void
    previousFrame: () => void
    nextFrame: () => void
    play: () => void
    pause: () => void
    togglePlay: () => void
    restart: () => void
    reset: () => void
}

export function useAnimationPlayer(
    initialFrameCount = 0,
    options: AnimationPlayerOptions = {},
): AnimationPlayer {
    const currentFrame = ref(0)
    const frameCount = ref(0)
    const isPlaying = ref(false)
    const intervalMs = normalizeInterval(options.intervalMs)
    let timer: ReturnType<typeof setInterval> | null = null

    const pause = (): void => {
        if (timer !== null) {
            clearInterval(timer)
            timer = null
        }
        isPlaying.value = false
    }

    const normalizeCount = (count: number): number => (
        Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
    )

    const setFrameCount = (count: number): void => {
        pause()
        frameCount.value = normalizeCount(count)
        if (currentFrame.value > frameCount.value) {
            currentFrame.value = frameCount.value
        }
    }

    const setFrame = (frame: number): void => {
        if (!Number.isFinite(frame)) {
            currentFrame.value = 0
            return
        }
        currentFrame.value = Math.min(
            frameCount.value,
            Math.max(0, Math.floor(frame)),
        )
        if (currentFrame.value >= frameCount.value) pause()
    }

    const previousFrame = (): void => setFrame(currentFrame.value - 1)
    const nextFrame = (): void => setFrame(currentFrame.value + 1)

    const advance = (): void => {
        if (currentFrame.value >= frameCount.value) {
            pause()
            return
        }
        currentFrame.value += 1
        if (currentFrame.value >= frameCount.value) pause()
    }

    const play = (): void => {
        if (timer !== null || frameCount.value <= 0 || currentFrame.value >= frameCount.value) return
        isPlaying.value = true
        timer = setInterval(advance, intervalMs)
    }

    const togglePlay = (): void => {
        if (isPlaying.value) pause()
        else play()
    }

    const restart = (): void => {
        pause()
        currentFrame.value = 0
    }

    const reset = restart

    setFrameCount(initialFrameCount)

    if (getCurrentScope()) onScopeDispose(pause)

    return {
        currentFrame,
        frameCount: computed(() => frameCount.value),
        progress: computed(() => frameCount.value === 0
            ? 0
            : (currentFrame.value / frameCount.value) * 100),
        isAtStart: computed(() => currentFrame.value === 0),
        isAtEnd: computed(() => currentFrame.value >= frameCount.value),
        isPlaying,
        setFrameCount,
        setFrame,
        previousFrame,
        nextFrame,
        play,
        pause,
        togglePlay,
        restart,
        reset,
    }
}

function normalizeInterval(intervalMs: number | undefined): number {
    return Number.isFinite(intervalMs) && intervalMs !== undefined
        ? Math.max(50, Math.floor(intervalMs))
        : DEFAULT_ANIMATION_INTERVAL_MS
}
