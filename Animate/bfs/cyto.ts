import { EdgeDefinition, NodeDefinition} from "cytoscape";
import cytoscape from 'cytoscape';


export function initCytoscape(domId: HTMLElement , nodes: NodeDefinition[], edges: EdgeDefinition[]) {
    const cy = cytoscape({
        container: domId,
        elements: {
            nodes: nodes,
            edges: edges
        },
        layout: {
            name:'cose',
            animate: true,
            nodeOverlap: 20,
            refresh: 20,
            fit: true,
            padding: 30,
            randomize: false,
            componentSpacing: 100,
            nestingFactor: 5,
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
                    'line-color': 'green'
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
        wheelSensitivity: 0.3,
    });
    return cy;
}
