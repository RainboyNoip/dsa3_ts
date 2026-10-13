import cytoscape, { type NodeDefinition, type EdgeDefinition } from 'cytoscape'
export function initCytoscape(container: HTMLElement, nodes: NodeDefinition[], edges: EdgeDefinition[]) {
  return cytoscape({ container, elements: { nodes, edges }, layout: { name: 'circle', padding: 40 },
    style: [
      { selector: 'node', style: { label: 'data(id)', 'text-valign': 'center', 'background-color': '#f1f5f9', color: '#18201f', 'border-width': 2, 'border-color': '#94a3b8' } },
      { selector: 'edge', style: { label: 'data(weight)', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'line-color': '#94a3b8', 'target-arrow-color': '#94a3b8', 'text-background-color': '#fff', 'text-background-opacity': 1, 'text-background-padding': '3px', width: 2 } },
      { selector: 'node.visited', style: { 'border-color': '#2563eb', 'border-width': 4 } },
      { selector: 'node.queued', style: { 'border-color': '#c2410c', 'border-width': 4 } },
      { selector: 'node.highlight', style: { 'background-color': '#7c3aed', color: '#fff' } },
      { selector: 'edge.visited', style: { 'line-color': '#2563eb', 'target-arrow-color': '#2563eb', width: 5 } },
      { selector: 'edge.queued', style: { 'line-color': '#c2410c', 'target-arrow-color': '#c2410c', width: 5 } },
      { selector: 'edge.visited.queued', style: { 'line-color': '#7c3aed', 'target-arrow-color': '#7c3aed', 'line-style': 'dashed' } },
    ], wheelSensitivity: 0.3,
  })
}
