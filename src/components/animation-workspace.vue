<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NSelect } from 'naive-ui'
import type { AnimationPlayer } from '@/animation/useAnimationPlayer'
import AnimationControls from '@/components/animation-controls.vue'
import SpliteLayout from '@/components/splite_layout_unocss.vue'

type GraphOption = {
    label: string
    value: number
}

const props = defineProps<{
    title: string
    player: AnimationPlayer
    graphOptions: GraphOption[]
    selectedGraph: number
}>()

const emit = defineEmits<{
    'update:selectedGraph': [value: number]
    'input-data': []
}>()

const selectedGraphValue = computed({
    get: () => props.selectedGraph,
    set: (value: number) => emit('update:selectedGraph', value),
})

const goHome = (): void => {
    window.location.assign(import.meta.env.BASE_URL)
}
</script>

<template>
  <div class="animation-workspace h-screen min-h-screen box-border p-2">
    <SpliteLayout>
      <template #top>
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <n-button
              quaternary
              circle
              aria-label="返回首页"
              title="返回首页"
              @click="goHome"
            >
              <Icon icon="fluent:arrow-left-16-regular" width="16" height="16" />
            </n-button>
            <h1 class="m-0 min-w-0 truncate text-base font-600">{{ title }}</h1>
          </div>
          <AnimationControls class="min-w-0 flex-1" :player="player" />
        </div>
      </template>

      <template #left>
        <div class="flex h-full min-h-0 flex-col">
          <div class="min-h-0 grow-0 p-2">
            <div class="flex flex-wrap items-center gap-2">
              <n-select
                v-model:value="selectedGraphValue"
                :options="graphOptions"
                aria-label="选择图数据"
                style="width: min(12.5rem, 100%)"
              />
              <n-button @click="emit('input-data')">输入数据</n-button>
            </div>
            <slot name="state" />
          </div>
          <div class="min-h-0 grow">
            <slot name="graph" />
          </div>
        </div>
      </template>

      <template #right>
        <slot name="code" />
      </template>
    </SpliteLayout>
  </div>
</template>
