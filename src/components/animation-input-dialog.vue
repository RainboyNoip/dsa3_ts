<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert } from 'naive-ui/es/alert'
import { NButton } from 'naive-ui/es/button'
import { NModal } from 'naive-ui/es/modal'
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
    if (props.rules?.maxFrames !== undefined) limits.push(`${props.rules.maxFrames} 帧`)
    if (props.rules?.maxRuntimeMs !== undefined) limits.push(`${props.rules.maxRuntimeMs} ms 运行时间`)
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
      <textarea
        v-model="input"
        class="graph-input"
        rows="8"
        placeholder="例如：
4 3
1 2
2 3
3 4"
        aria-label="图数据文本"
        aria-describedby="graph-input-help"
      ></textarea>
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

<style scoped>
.graph-input {
  width: 100%;
  min-height: 12rem;
  max-height: 28rem;
  resize: vertical;
  border: 1px solid #cfd8d4;
  border-radius: 4px;
  padding: 0.75rem;
  background: #fff;
  color: #18201f;
  font: 0.875rem/1.5 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.graph-input:focus-visible {
  outline: 3px solid rgb(23 107 91 / 30%);
  outline-offset: 1px;
}
</style>
