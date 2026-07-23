import { computed, ref, type ComputedRef, type Ref } from 'vue'

export type AnimationPlayer = {
    currentFrame: Ref<number>
    frameCount: ComputedRef<number>
    progress: ComputedRef<number>
    isAtStart: ComputedRef<boolean>
    isAtEnd: ComputedRef<boolean>
    setFrameCount: (count: number) => void
    setFrame: (frame: number) => void
    previousFrame: () => void
    nextFrame: () => void
    reset: () => void
}

export function useAnimationPlayer(initialFrameCount = 0): AnimationPlayer {
    const currentFrame = ref(0)
    const frameCount = ref(0)

    const normalizeCount = (count: number): number => (
        Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
    )

    const setFrameCount = (count: number): void => {
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
    }

    const previousFrame = (): void => setFrame(currentFrame.value - 1)
    const nextFrame = (): void => setFrame(currentFrame.value + 1)
    const reset = (): void => setFrame(0)

    setFrameCount(initialFrameCount)

    return {
        currentFrame,
        frameCount: computed(() => frameCount.value),
        progress: computed(() => frameCount.value === 0
            ? 0
            : (currentFrame.value / frameCount.value) * 100),
        isAtStart: computed(() => currentFrame.value === 0),
        isAtEnd: computed(() => currentFrame.value >= frameCount.value),
        setFrameCount,
        setFrame,
        previousFrame,
        nextFrame,
        reset,
    }
}
