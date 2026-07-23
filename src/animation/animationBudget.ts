import { AnimationBudgetExceeded } from './animationTimeline'

export function isAnimationBudgetExceeded(error: unknown): error is AnimationBudgetExceeded {
    return error instanceof AnimationBudgetExceeded
        || (typeof error === 'object'
            && error !== null
            && (error as { name?: unknown }).name === 'AnimationBudgetExceeded')
}

export function formatAnimationBudgetError(error: AnimationBudgetExceeded): string {
    if (error.reason === 'max_frames') {
        return `动画帧数达到上限 ${error.limit}，请减少节点或边后重试`
    }
    return `算法运行超过 ${error.limit} ms，请减少节点或边后重试`
}
