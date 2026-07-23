<script setup lang="ts">
import { Icon, type IconifyIcon } from '@iconify/vue'
import animateList from './animate_list.json'

type AlgorithmMeta = {
  title: string
  eyebrow: string
  description: string
  tags: string[]
  accent: string
  tint: string
  icon: IconifyIcon
}

const baseUrl = __BASE_URL__

const resolveUrl = (path: string) => {
  const normalizedBase = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')
  return `${normalizedBase}/${path.replace(/^\//, '')}`
}

const icons: Record<string, IconifyIcon> = {
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
  arrowUpRight: {
    body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10v10M7 17L17 7"/>',
    width: 24,
    height: 24,
  },
}

const algorithmMeta: Record<string, AlgorithmMeta> = {
  topsort: {
    title: '拓扑排序',
    eyebrow: 'TOPOLOGICAL SORT',
    description: '为有向无环图中的节点建立线性顺序。',
    tags: ['有向图', 'DAG'],
    accent: '#176b5b',
    tint: '#edf7f4',
    icon: icons.branch,
  },
  fleury: {
    title: 'Fleury 算法',
    eyebrow: 'EULER TRAIL',
    description: '沿边逐步构造欧拉迹，并判断桥的取舍。',
    tags: ['无向图', '欧拉迹'],
    accent: '#c24b32',
    tint: '#fcf1ed',
    icon: icons.route,
  },
  dfsscc: {
    title: '强连通分量',
    eyebrow: 'STRONGLY CONNECTED',
    description: '识别有向图中彼此可达的节点集合。',
    tags: ['深度优先', '有向图'],
    accent: '#3157a4',
    tint: '#eff3fb',
    icon: icons.component,
  },
  bfs: {
    title: 'BFS 遍历',
    eyebrow: 'BREADTH FIRST SEARCH',
    description: '按层逐级遍历图中所有可达的节点。',
    tags: ['无向图', '队列'],
    accent: '#7c3aed',
    tint: '#f5f3ff',
    icon: icons.search,
  },
  bfs_shortest_path: {
    title: 'BFS 最短路',
    eyebrow: 'SHORTEST PATH',
    description: '在权值相同的图中寻找最短路径。',
    tags: ['无向图', '距离'],
    accent: '#0891b2',
    tint: '#ecfeff',
    icon: icons.layers,
  },
  dfs: {
    title: 'DFS 遍历',
    eyebrow: 'DEPTH FIRST SEARCH',
    description: '沿路径深入探索图的每个分支。',
    tags: ['无向图', '递归'],
    accent: '#db2777',
    tint: '#fdf2f8',
    icon: icons.route,
  },
  tarjan_cut: {
    title: 'Tarjan 割点',
    eyebrow: 'CUT VERTEX',
    description: '找出无向图中移除后会增加连通分量数的关键节点。',
    tags: ['无向图', 'dfn/low'],
    accent: '#ca8a04',
    tint: '#fefce8',
    icon: icons.scissors,
  },
}

const algorithms = animateList.map((item, index) => ({
  ...item,
  ...algorithmMeta[item.name],
  index: String(index + 1).padStart(2, '0'),
  href: resolveUrl(item.url),
}))
</script>

<template>
  <div class="page-shell">
    <header class="site-header">
      <div class="site-header__inner">
        <a class="brand" :href="baseUrl" aria-label="DSA3 算法动画首页">
          <span class="brand__mark" aria-hidden="true">D3</span>
          <span class="brand__name">DSA3</span>
          <span class="brand__divider" aria-hidden="true"></span>
          <span class="brand__descriptor">算法动画</span>
        </a>

        <div class="library-status" :aria-label="`当前共有 ${algorithms.length} 个算法演示`">
          <span class="library-status__dot" aria-hidden="true"></span>
          {{ algorithms.length }} 个演示
        </div>
      </div>
    </header>

    <main class="catalog">
      <section class="catalog__intro" aria-labelledby="catalog-title">
        <div>
          <p class="catalog__kicker">GRAPH ALGORITHMS · 图算法</p>
          <h1 id="catalog-title">算法可视化实验室</h1>
        </div>
        <p class="catalog__range" aria-hidden="true">01—{{ String(algorithms.length).padStart(2, '0') }}</p>
      </section>

      <section class="catalog__library" aria-labelledby="library-title">
        <div class="section-heading">
          <h2 id="library-title">演示目录</h2>
          <span>{{ algorithms.length }} ITEMS</span>
        </div>

        <div class="algorithm-grid">
          <a
            v-for="item in algorithms"
            :key="item.name"
            class="algorithm-card"
            :href="item.href"
            :aria-label="`打开${item.title}演示`"
            :style="{
              '--card-accent': item.accent,
              '--card-tint': item.tint,
            }"
          >
            <div class="algorithm-card__visual" aria-hidden="true">
              <span class="algorithm-card__index">{{ item.index }}</span>
              <Icon class="algorithm-card__watermark" :icon="item.icon" />
              <span class="algorithm-card__icon">
                <Icon :icon="item.icon" />
              </span>
            </div>

            <div class="algorithm-card__content">
              <p class="algorithm-card__eyebrow">{{ item.eyebrow }}</p>
              <h3>{{ item.title }}</h3>
              <p class="algorithm-card__description">{{ item.description }}</p>

              <div class="algorithm-card__tags" aria-label="算法标签">
                <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
              </div>

              <div class="algorithm-card__action" aria-hidden="true">
                <span>进入演示</span>
                <Icon :icon="icons.arrowUpRight" />
              </div>
            </div>
          </a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <span>DSA3 · GRAPH ALGORITHMS</span>
        <span>VISUAL STUDY LAB</span>
      </div>
    </footer>
  </div>
</template>
