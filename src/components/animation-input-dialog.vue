<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NInput, NModal } from 'naive-ui'
import type { Graph } from '@/lib/graph_ts'
import { GraphType } from '@/lib/graph_ts'
import { parseGraphInput, type GraphInputRules } from '@/animation/graphInput'

const props = defineProps<{
    show: boolean
    sample: string
    graphType: GraphType
    rules?: GraphInputRules
}>()

const emit = defineEmits<{
    'update:show': [value: boolean]
    submit: [graph: Graph]
}>()

const input = ref('')

const validation = computed(() => parseGraphInput(input.value, props.graphType, props.rules))
const errorMessage = computed(() => validation.value.ok ? '' : validation.value.error)
const limitDescription = computed(() => {
    const limits: string[] = []
    if (props.rules?.maxNodes !== undefined) limits.push(`${props.rules.maxNodes} 个节点`)
    if (props.rules?.maxEdges !== undefined) limits.push(`${props.rules.maxEdges} 条边`)
    return limits.length > 0 ? `当前最多支持 ${limits.join('、')}。` : ''
})

watch(() => props.show, (show) => {
    if (show) input.value = props.sample
})

const close = (): void => emit('update:show', false)

const restoreSample = (): void => {
    input.value = props.sample
}

const submit = (): void => {
    if (!validation.value.ok) return
    emit('submit', validation.value.graph)
    close()
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="输入图数据"
    style="width: min(42rem, calc(100vw - 2rem))"
    @update:show="emit('update:show', $event)"
  >
    <div class="flex flex-col gap-3">
      <p id="graph-input-help" class="m-0 text-sm text-gray-500">
        首行为节点数和边数，后续每行填写 u v 或 u v w。{{ limitDescription }}
      </p>
      <n-input
        v-model:value="input"
        type="textarea"
        :autosize="{ minRows: 8, maxRows: 18 }"
        placeholder="例如：\n4 3\n1 2\n2 3\n3 4"
        :input-props="{
          'aria-label': '图数据文本',
          'aria-describedby': 'graph-input-help',
        }"
      />
      <n-alert v-if="errorMessage" type="error" :show-icon="true">
        {{ errorMessage }}
      </n-alert>
      <div class="flex flex-wrap justify-end gap-2">
        <n-button @click="restoreSample">恢复样例</n-button>
        <n-button @click="close">取消</n-button>
        <n-button type="primary" :disabled="!validation.ok" @click="submit">应用数据</n-button>
      </div>
    </div>
  </n-modal>
</template>
