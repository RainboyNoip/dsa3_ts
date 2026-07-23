import { onBeforeUnmount, shallowRef, type Ref } from 'vue'
import type { Core, EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { AnimationFrame } from './animationTypes'

export type CytoscapeFrame = Pick<AnimationFrame, 'edges_state' | 'nodes_state'>

type CreateCytoscape = (
    container: HTMLElement,
    nodes: NodeDefinition[],
    edges: EdgeDefinition[],
) => Core

export const animationClasses = [
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
] as const

export type AnimationVisualState = {
    class: readonly string[]
    color?: string
    dfn?: number
}

export function changedAnimationStateKeys(
    previous: ReadonlyMap<string, AnimationVisualState>,
    next: ReadonlyMap<string, AnimationVisualState>,
): string[] {
    const keys = new Set([...previous.keys(), ...next.keys()])
    return [...keys].filter((key) => {
        const before = previous.get(key)
        const after = next.get(key)
        if (before === undefined || after === undefined) return true
        return before.color !== after.color
            || before.dfn !== after.dfn
            || before.class.length !== after.class.length
            || before.class.some((className, index) => className !== after.class[index])
    })
}

export function useCytoscapeRenderer(
    container: Ref<HTMLElement | null>,
    createCytoscape: CreateCytoscape,
) {
    const instance = shallowRef<Core | null>(null)
    let currentNodes: NodeDefinition[] = []
    let currentEdges: EdgeDefinition[] = []
    let currentFrame: CytoscapeFrame | null = null
    let resizeObserver: ResizeObserver | null = null
    let previousNodeStates = new Map<string, AnimationVisualState>()
    let previousEdgeStates = new Map<string, AnimationVisualState>()

    const destroy = (): void => {
        resizeObserver?.disconnect()
        resizeObserver = null
        instance.value?.elements().stop(true)
        instance.value?.stop()
        instance.value?.destroy()
        instance.value = null
        previousNodeStates = new Map()
        previousEdgeStates = new Map()
    }

    const mount = (nodes: NodeDefinition[], edges: EdgeDefinition[]): Core | null => {
        destroy()
        currentNodes = nodes
        currentEdges = edges
        currentFrame = null
        if (!container.value) return null
        instance.value = createCytoscape(container.value, nodes, edges)
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => instance.value?.resize())
            resizeObserver.observe(container.value)
        }
        return instance.value
    }

    const clearClasses = (): void => {
        const cy = instance.value
        if (!cy) return

        cy.elements().removeClass(animationClasses.join(' '))
        cy.edges().removeData('dfn')
    }

    const applyFrame = (frame: CytoscapeFrame | null): void => {
        currentFrame = frame
        const cy = instance.value
        if (!cy) return

        const nextNodeStates = new Map<string, AnimationVisualState>()
        const nextEdgeStates = new Map<string, AnimationVisualState>()
        for (const node of frame?.nodes_state || []) {
            nextNodeStates.set(String(node.id), {
                class: [...node.class],
                color: node.color,
            })
        }
        for (const edge of frame?.edges_state || []) {
            nextEdgeStates.set(`${edge.source}\u0000${edge.target}`, {
                class: [...edge.class],
                dfn: edge.dfn,
            })
        }

        cy.batch(() => {
            for (const key of changedAnimationStateKeys(previousEdgeStates, nextEdgeStates)) {
                const separator = key.indexOf('\u0000')
                const source = key.slice(0, separator)
                const target = key.slice(separator + 1)
                const elements = cy.edges(`[source = "${source}"][target = "${target}"]`)
                const state = nextEdgeStates.get(key)
                elements.removeClass(animationClasses.join(' '))
                elements.removeData('dfn')
                if (state?.class.length) elements.addClass(state.class.join(' '))
                if (state?.dfn !== undefined) elements.data('dfn', state.dfn)
            }

            for (const key of changedAnimationStateKeys(previousNodeStates, nextNodeStates)) {
                const elements = cy.nodes(`[id = "${key}"]`)
                const state = nextNodeStates.get(key)
                elements.removeClass(animationClasses.join(' '))
                elements.removeData('color')
                if (state?.class.length) elements.addClass(state.class.join(' '))
                if (state?.color !== undefined) elements.data('color', state.color)
            }
        })

        previousNodeStates = nextNodeStates
        previousEdgeStates = nextEdgeStates
    }

    const relayout = (): void => {
        if (!container.value || currentNodes.length === 0) return
        const frame = currentFrame
        if (mount(currentNodes, currentEdges)) applyFrame(frame)
    }

    onBeforeUnmount(destroy)

    return {
        instance,
        mount,
        applyFrame,
        clearClasses,
        relayout,
        destroy,
    }
}
