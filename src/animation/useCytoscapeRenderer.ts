import { onBeforeUnmount, shallowRef, type Ref } from 'vue'
import type { Core, EdgeDefinition, NodeDefinition } from 'cytoscape'
import type { NodeId } from '../lib/graph_ts'

export type CytoscapeFrame = {
    edges_state: Array<{ source: NodeId; target: NodeId; class: string[] }>
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

    const destroy = (): void => {
        instance.value?.destroy()
        instance.value = null
    }

    const mount = (nodes: NodeDefinition[], edges: EdgeDefinition[]): Core | null => {
        destroy()
        if (!container.value) return null
        instance.value = createCytoscape(container.value, nodes, edges)
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
    }

    const applyFrame = (frame: CytoscapeFrame | null): void => {
        const cy = instance.value
        if (!cy) return

        cy.batch(() => {
            clearClasses()
            if (!frame) return

            for (const edge of frame.edges_state) {
                cy.edges(`[source = "${edge.source}"][target = "${edge.target}"]`)
                    .addClass(edge.class.join(' '))
            }
            for (const node of frame.nodes_state) {
                const elements = cy.nodes(`[id = "${node.id}"]`)
                elements.addClass(node.class.join(' '))
                if (node.color !== undefined) elements.data('color', node.color)
            }
        })
    }

    onBeforeUnmount(destroy)

    return {
        instance,
        mount,
        applyFrame,
        clearClasses,
        destroy,
    }
}
