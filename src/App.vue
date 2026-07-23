<script setup lang="ts">
import LocalIcon from './components/local-icon.vue'
import { algorithmRegistry, catalogActionIcon } from './algorithmRegistry'

const baseUrl = __BASE_URL__

const resolveUrl = (path: string) => {
  const normalizedBase = baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')
  return `${normalizedBase}/${path.replace(/^\//, '')}`
}

const algorithms = algorithmRegistry.map((item, index) => ({
  ...item,
  index: String(index + 1).padStart(2, '0'),
  href: resolveUrl(item.entry),
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
            :key="item.id"
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
              <LocalIcon class="algorithm-card__watermark" :icon="item.icon" />
              <span class="algorithm-card__icon">
                <LocalIcon :icon="item.icon" />
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
                <LocalIcon :icon="catalogActionIcon" />
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
