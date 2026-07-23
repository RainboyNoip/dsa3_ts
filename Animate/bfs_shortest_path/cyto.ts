import { EdgeDefinition, NodeDefinition } from "cytoscape";
import cytoscape from 'cytoscape';

export function initCytoscape(domId: HTMLElement, nodes: NodeDefinition[], edges: EdgeDefinition[]) {
    const cy = cytoscape({
        container: domId,
        elements: {
            nodes: nodes,
            edges: edges
        },
        layout: {
            name: 'cose',
            animate: false,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            gravity: 80,
        },
        style: [
            {
                selector: 'node',
                style: {
                    'label': 'data(id)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': 'black',
                    'background-color': 'white',
                    'border-color': 'black',
                    'border-width': 1,
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'none',
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'node.highlight',
                style: {
                    'color': 'white',
                    'background-color': 'blue',
                }
            },
            {
                selector: 'edge.highlight',
                style: {
                    'width': 3,
                    'line-color': 'green',
                }
            },
            {
                selector: 'node.visited',
                style: {
                    'color': 'white',
                    'background-color': 'red',
                }
            },
            {
                selector: 'node.now_vis',
                style: {
                    'color': 'white',
                    'background-color': 'blue',
                }
            },
            {
                selector: 'edge.queued',
                style: {
                    'width': 3,
                    'line-color': 'orange',
                }
            }
        ],
    });
    return cy;
}
