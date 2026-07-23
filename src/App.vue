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
  <div class="min-h-screen bg-white">
    <div class="max-w-3xl mx-auto px-4 py-12">
      <h1 class="text-xl font-bold text-gray-800 mb-8">算法动画演示</h1>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <a
          v-for="(item, idx) in animate_list"
          :key="item.name"
          :href="baseUrl + item.url"
          class="block bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-400 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              :style="{ background: colors[idx % colors.length] }"
            >
              {{ item.name.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-gray-800">{{ item.name }}</div>
              <div class="text-xs text-gray-400 truncate">{{ item.desc }}</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

