<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NSelect } from 'naive-ui'
import type { AnimationPlayer } from '@/animation/useAnimationPlayer'
import type { Graph } from '@/lib/graph_ts'
import { GraphType } from '@/lib/graph_ts'
import type { GraphInputRules } from '@/animation/graphInput'
import AnimationControls from '@/components/animation-controls.vue'
import AnimationInputDialog from '@/components/animation-input-dialog.vue'
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
    graphType: GraphType
    sampleInput: string
    inputRules?: GraphInputRules
}>()

const emit = defineEmits<{
    'update:selectedGraph': [value: number]
    'input-data': [graph: Graph]
}>()

const selectedGraphValue = computed({
    get: () => props.selectedGraph,
    set: (value: number) => emit('update:selectedGraph', value),
})
const inputDialogOpen = ref(false)

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
              <n-button @click="inputDialogOpen = true">输入数据</n-button>
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
    <AnimationInputDialog
      v-model:show="inputDialogOpen"
      :sample="sampleInput"
      :graph-type="graphType"
      :rules="inputRules"
      @submit="emit('input-data', $event)"
    />
  </div>
</template>
