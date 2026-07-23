import type { IconifyIcon } from '@iconify/vue'

export type AlgorithmDefinition = {
  id: string
  buildName: string
  entry: `Animate/${string}/index.html`
  sourceFile: `${string}.ts`
  title: string
  eyebrow: string
  description: string
  tags: readonly string[]
  accent: `#${string}`
  tint: `#${string}`
  icon: IconifyIcon
}

const icons = {
  branch: {
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/></g>',
    width: 24,
    height: 24,
  },
  route: {
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></g>',
    width: 24,
    height: 24,
  },
  component: {
    body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0zm-13.239 0a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0zm6.619 6.619a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0zm0-13.238a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
    width: 24,
    height: 24,
  },
  search: {
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></g>',
    width: 24,
    height: 24,
  },
  layers: {
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></g>',
    width: 24,
    height: 24,
  },
  scissors: {
    body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></g>',
    width: 24,
    height: 24,
  },
} satisfies Record<string, IconifyIcon>

export const catalogActionIcon: IconifyIcon = {
  body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10v10M7 17L17 7"/>',
  width: 24,
  height: 24,
}

export const algorithmRegistry = [
  {
    id: 'topsort',
    buildName: 'topsort',
    entry: 'Animate/topsort/index.html',
    sourceFile: 'topsort.ts',
    title: '拓扑排序',
    eyebrow: 'TOPOLOGICAL SORT',
    description: '为有向无环图中的节点建立线性顺序。',
    tags: ['有向图', 'DAG'],
    accent: '#176b5b',
    tint: '#edf7f4',
    icon: icons.branch,
  },
  {
    id: 'fleury',
    buildName: 'fleury',
    entry: 'Animate/fleury/index.html',
    sourceFile: 'fleury.ts',
    title: 'Fleury 算法',
    eyebrow: 'EULER TRAIL',
    description: '沿边逐步构造欧拉迹，并判断桥的取舍。',
    tags: ['无向图', '欧拉迹'],
    accent: '#c24b32',
    tint: '#fcf1ed',
    icon: icons.route,
  },
  {
    id: 'dfsscc',
    buildName: 'dfsscc',
    entry: 'Animate/dfsscc/index.html',
    sourceFile: 'dfsscc.ts',
    title: '强连通分量',
    eyebrow: 'STRONGLY CONNECTED',
    description: '识别有向图中彼此可达的节点集合。',
    tags: ['深度优先', '有向图'],
    accent: '#3157a4',
    tint: '#eff3fb',
    icon: icons.component,
  },
  {
    id: 'bfs',
    buildName: 'bfs',
    entry: 'Animate/bfs/index.html',
    sourceFile: 'bfs.ts',
    title: 'BFS 遍历',
    eyebrow: 'BREADTH FIRST SEARCH',
    description: '从起点按层访问其所在的可达分量。',
    tags: ['无向图', '队列'],
    accent: '#7c3aed',
    tint: '#f5f3ff',
    icon: icons.search,
  },
  {
    id: 'bfs_shortest_path',
    buildName: 'bfs_sp',
    entry: 'Animate/bfs_shortest_path/index.html',
    sourceFile: 'bfs_sp.ts',
    title: 'BFS 最短路',
    eyebrow: 'SHORTEST PATH',
    description: '在权值相同的图中寻找最短路径。',
    tags: ['无向图', '距离'],
    accent: '#0891b2',
    tint: '#ecfeff',
    icon: icons.layers,
  },
  {
    id: 'dfs',
    buildName: 'dfs',
    entry: 'Animate/dfs/index.html',
    sourceFile: 'dfs.ts',
    title: 'DFS 遍历',
    eyebrow: 'DEPTH FIRST SEARCH',
    description: '从起点沿路径深入探索其所在的可达分量。',
    tags: ['无向图', '递归'],
    accent: '#db2777',
    tint: '#fdf2f8',
    icon: icons.route,
  },
  {
    id: 'tarjan_cut',
    buildName: 'tarjan_cut',
    entry: 'Animate/tarjan_cut/index.html',
    sourceFile: 'tarjan.ts',
    title: 'Tarjan 割点',
    eyebrow: 'CUT VERTEX',
    description: '找出无向图中移除后会增加连通分量数的关键节点。',
    tags: ['无向图', 'dfn/low'],
    accent: '#ca8a04',
    tint: '#fefce8',
    icon: icons.scissors,
  },
] as const satisfies readonly AlgorithmDefinition[]

export type AlgorithmId = typeof algorithmRegistry[number]['id']
