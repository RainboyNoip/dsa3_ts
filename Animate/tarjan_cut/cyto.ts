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
                    'curve-style': 'bezier'
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
                selector: 'node.visited',
                style: {
                    'color': 'gray',
                    'background-color': '#ddd',
                }
            },
            {
                selector: 'node.cut',
                style: {
                    'background-color': 'yellow',
                    'font-weight': 'bold',
                    'border-style': 'dashed',
                    'border-width': 3,
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
                selector: 'edge.back_ancestor',
                style: {
                    'width': 3,
                    'line-color': 'gray',
                    'line-style': 'dashed',
                }
            }
        ],
        wheelSensitivity: 0.3,
    });
    return cy;
}
