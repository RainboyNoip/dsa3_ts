<script lang="ts">
import { defineComponent } from 'vue'
import animate_list from './animate_list.json'

const colors = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
]

export default defineComponent({
  data() {
    return {
      //@ts-ignore
      baseUrl: __BASE_URL__,
      animate_list,
      colors,
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="container mx-auto px-6 py-6">
        <h1 class="text-2xl font-bold text-gray-800">算法动画演示</h1>
        <p class="text-gray-500 mt-1">Algorithm Visualization Platform</p>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          v-for="(item, idx) in animate_list"
          :key="item.name"
          :href="baseUrl + item.url"
          class="card group"
        >
          <div class="card-accent" :style="{ background: colors[idx % colors.length] }" />
          <div class="p-6">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                :style="{ background: colors[idx % colors.length] }"
              >
                {{ item.name.charAt(0).toUpperCase() }}
              </div>
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {{ item.name }}
                </h2>
                <p class="text-gray-500 text-sm truncate">{{ item.desc }}</p>
              </div>
            </div>
            <div class="mt-4 flex items-center text-sm text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>查看详情</span>
              <span class="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </div>
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 block transition-all duration-200;
}

.card:hover {
  @apply shadow-md;
  transform: translateY(-2px);
}

.card-accent {
  height: 4px;
  border-radius: 12px 12px 0 0;
}
</style>
