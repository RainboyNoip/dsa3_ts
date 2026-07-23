import { EdgeDefinition, NodeDefinition} from "cytoscape";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';


export function initCytoscape(domId: HTMLElement , nodes: NodeDefinition[], edges: EdgeDefinition[]) {
    cytoscape.use(dagre);
    const cy = cytoscape({
        container: domId,
        elements: {
            nodes: nodes,
            edges: edges
        },
        layout:{
            name: 'dagre',
            //@ts-ignore
            rankDir:'TB',
            fit:true,
            acyclicer: 'greedy', // If set to 'greedy'
            animate: true,
        },
        // layout: {
        //     // name: 'dagre',
        //     // animate: true,
        //     // rankDir:'BT',
        //     // acyclicer: 'greedy', // If set to 'greedy'
        //     name:'cose',
        //     // gravity: 0.1,
        //     // name:'grid',
        //     animate: true,
        //     // idealEdgeLength: 100, // 理想边长，增大这个值会让节点间距更大  
        //     nodeOverlap: 20, // 节点重叠程度  
        //     refresh: 20, // 布局刷新率  
        //     fit: true, // 是否自适应视图  
        //     padding: 30, // 图形周围的内边距  
        //     randomize: false, // 是否随机初始位置  
        //     componentSpacing: 100, // 不同连通分量之间的间距，增大这个值可以让不同组的节点分得更开  
        //     nodeRepulsion: 400000, // 节点之间的斥力，增大这个值会让节点相互远离  
        //     // edgeElasticity: 100, // 边的弹性  
        //     nestingFactor: 5, // 嵌套因子  
        //     gravity: 80, // 重力，控制节点向中心聚集的程度 
        // },
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
                    // 'line-color': '#0d0015',
                    'line-color': '#888',
                    'target-arrow-color': '#888',
                    'target-arrow-shape': 'triangle', // 改为 V 形箭头
                    'curve-style': 'bezier'
                }
            },
            {
                selector: 'node.visited',
                style: {
                    'color': 'white',
                    'background-color': 'red', // 结点背景色设为白色  
                }
            },
            {
                selector: 'node.now_vis',
                style: {
                    'color': 'white',
                    'background-color': 'blue', // 结点背景色设为白色  
                }
            },
            {
                selector: 'node.cycle',
                style: {
                    'color': 'white',
                    'background-color': '#c2413b',
                    'border-color': '#8f2824',
                    'border-width': 3,
                }
            },
            {

                selector: 'edge.del',
                style: {
                    'line-color': '#c5ebeb', // 结点背景色设为白色  
                    'line-style': 'dashed'
                }
            },
            {
                selector: 'edge.cycle',
                style: {
                    'line-color': '#c2413b',
                    'line-style': 'dashed',
                    'width': 3,
                }
            }
        ],
        // wheelSensitivity: 0.3,
    });
    return cy;
}
