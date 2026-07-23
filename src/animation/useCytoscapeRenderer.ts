import { onBeforeUnmount, shallowRef, type Ref } from 'vue'
import type { Core, EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { NodeId } from '../lib/graph_ts'

export type CytoscapeFrame = {
    edges_state: Array<{ source: NodeId; target: NodeId; class: string[]; dfn?: number }>
    nodes_state: Array<{ id: NodeId; class: string[]; color?: string }>
}

type CreateCytoscape = (
    container: HTMLElement,
    nodes: NodeDefinition[],
    edges: EdgeDefinition[],
) => Core

export function useCytoscapeRenderer(
    container: Ref<HTMLElement | null>,
    createCytoscape: CreateCytoscape,
) {
    const instance = shallowRef<Core | null>(null)
    let currentNodes: NodeDefinition[] = []
    let currentEdges: EdgeDefinition[] = []
    let currentFrame: CytoscapeFrame | null = null
    let resizeObserver: ResizeObserver | null = null

    const destroy = (): void => {
        resizeObserver?.disconnect()
        resizeObserver = null
        instance.value?.destroy()
        instance.value = null
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

        const classes = new Set<string>()
        cy.elements().forEach((element) => {
            element.classes().forEach((className) => classes.add(className))
        })
        if (classes.size > 0) {
            cy.elements().removeClass([...classes].join(' '))
        }
        cy.edges().removeData('dfn')
    }

    const applyFrame = (frame: CytoscapeFrame | null): void => {
        currentFrame = frame
        const cy = instance.value
        if (!cy) return

        cy.batch(() => {
            clearClasses()
            if (!frame) return

            for (const edge of frame.edges_state) {
                const elements = cy.edges(`[source = "${edge.source}"][target = "${edge.target}"]`)
                elements.addClass(edge.class.join(' '))
                if (edge.dfn !== undefined) elements.data('dfn', edge.dfn)
            }
            for (const node of frame.nodes_state) {
                const elements = cy.nodes(`[id = "${node.id}"]`)
                elements.addClass(node.class.join(' '))
                if (node.color !== undefined) elements.data('color', node.color)
            }
        })
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
