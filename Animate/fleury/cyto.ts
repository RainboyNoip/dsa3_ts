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
            // name: 'dagre',
            // animate: true,
            // rankDir:'BT',
            // acyclicer: 'greedy', // If set to 'greedy'
            name:'cose',
            // gravity: 0.1,
            // name:'grid',
            animate: false,
            // idealEdgeLength: 100, // 理想边长，增大这个值会让节点间距更大  
            nodeOverlap: 20, // 节点重叠程度  
            refresh: 20, // 布局刷新率  
            fit: true, // 是否自适应视图  
            padding: 30, // 图形周围的内边距  
            randomize: false, // 是否随机初始位置  
            componentSpacing: 100, // 不同连通分量之间的间距，增大这个值可以让不同组的节点分得更开  
            // nodeRepulsion: 400000, // 节点之间的斥力，增大这个值会让节点相互远离  
            // edgeElasticity: 100, // 边的弹性  
            nestingFactor: 5, // 嵌套因子  
            gravity: 80, // 重力，控制节点向中心聚集的程度 
        },
        style: [
            {
                selector: 'node',
                style: {
                    // 'background-color': '#666',
                    'label': 'data(id)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': 'black', // 结点标签颜色设为黑色  
                    'background-color': 'white', // 结点背景色设为白色  
                    'border-color': 'black', // 结点边框颜色设为黑色  
                    'border-width': 1, // 结点边框宽度设为 2  
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
                selector: 'edge.highlight',
                style: {
                    'width': 3,
                    'line-color': 'green'
                }
            },
            {
                selector: 'node.highlight',
                style: {
                    'color': 'white',
                    'background-color': 'blue', // 结点背景色设为白色  
                }
            },
            {

                selector: 'edge.cut_edge',
                style: {
                    'line-color': 'yellow', // 结点背景色设为白色  
                    'line-style': 'dashed'  
                }
            },
            {

                selector: 'edge.del',
                style: {
                    'line-color': '#c5ebeb', // 结点背景色设为白色  
                    'label': 'data(dfn)',
                    'line-style': 'dashed'
                }
            }
        ],
        wheelSensitivity: 0.3,
    });
    return cy;
}
