import { EdgeDefinition, NodeDefinition } from "cytoscape";
import cytoscape from 'cytoscape';


export function initCytoscape(domId: HTMLElement , nodes: NodeDefinition[], edges: EdgeDefinition[]) {
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
                    'width': 1,
                    'line-color': '#0d0015',
                }
            },
            {
                // 已经走过、还在当前栈上的边（行进中的轨迹），标签是使用顺序
                selector: 'edge.highlight',
                style: {
                    'width': 3,
                    'line-color': '#16a34a',
                    'label': 'data(dfn)',
                    'color': '#15803d',
                    'font-size': 10,
                }
            },
            {
                // 当前正在考察的边（压栈前）
                selector: 'edge.now_vis',
                style: {
                    'width': 4,
                    'line-color': '#dc2626',
                }
            },
            {
                // 已经收进答案的边，标签是它被使用的顺序
                selector: 'edge.visited',
                style: {
                    'width': 2,
                    'line-color': '#2563eb',
                    'label': 'data(dfn)',
                    'color': '#2563eb',
                    'font-size': 10,
                }
            },
            {
                // 当前点
                selector: 'node.highlight',
                style: {
                    'color': 'white',
                    'background-color': '#2563eb',
                    'border-color': '#1e3a8a',
                    'border-width': 2,
                }
            },
            {
                // 栈上的点
                selector: 'node.queued',
                style: {
                    'background-color': '#c7d2fe',
                    'border-color': '#4338ca',
                    'border-width': 2,
                }
            },
            {
                // 已经收路的点
                selector: 'node.visited',
                style: {
                    'background-color': '#dcfce7',
                    'border-color': '#16a34a',
                }
            },
            {
                // 奇度点
                selector: 'node.colored',
                style: {
                    'background-color': '#fef08a',
                    'border-color': '#ca8a04',
                    'border-width': 2,
                }
            }
        ],
        wheelSensitivity: 0.3,
    });
    return cy;
}
