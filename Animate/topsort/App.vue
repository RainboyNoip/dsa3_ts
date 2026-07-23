<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/code-editor.vue'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { topsort } from './topsort'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.digraph))
const topSort = ref(new topsort())
const renderer = useCytoscapeRenderer(cyContainer, initCytoscape)
const player = useAnimationPlayer()
const {
    currentFrame,
} = player

const jumpLine = ref<[number, number]>([-1, -1])
const log = ref('')

const applyFrame = (index: number): void => {
    if (index <= 0) {
        renderer.applyFrame(null)
        jumpLine.value = [-1, -1]
        log.value = ''
        return
    }

    const frame = topSort.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    topSort.value.clear()
    topSort.value.set_graph(graph.value as Graph)
    topSort.value.set_pointJumpInfo(point_jump_info)
    topSort.value.run_top_sort()
    player.setFrameCount(topSort.value.frame_cnt)
    player.reset()
    applyFrame(0)
}

watch(selectedGraph, (next, previous) => {
    if (next === previous) return
    initGraph(defaultGraphData[next].nodes, defaultGraphData[next].edges)
})

watch(currentFrame, (frame) => applyFrame(frame))

onMounted(() => {
    const data = defaultGraphData[selectedGraph.value]
    initGraph(data.nodes, data.edges)
})

const queue = computed(() => currentFrame.value <= 0 ? [] : topSort.value.get_frame(currentFrame.value).que)
const topList = computed(() => currentFrame.value <= 0 ? [] : topSort.value.get_frame(currentFrame.value).top_sort)

const getInputData = (): void => {
    alert('TODO')
}
</script>

<template>
  <AnimationWorkspace
    v-model:selected-graph="selectedGraph"
    title="拓扑排序"
    :player="player"
    :graph-options="defaultGraphSelectorOptions"
    @input-data="getInputData"
  >
    <template #state>
      <div class="mt-2">
        <span class="me-2">队列:</span>
        <span v-for="item in queue" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
      </div>
      <div class="mt-1">
        <span class="me-2">拓扑序:</span>
        <span v-for="item in topList" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
      </div>
      <div class="m-1 mt-3">{{ log }}</div>
    </template>

    <template #graph>
      <div id="cy" ref="cyContainer" class="h-full min-h-0"></div>
    </template>

    <template #code>
      <code-editor :code="code" :hline_start="jumpLine[0]" :hline_end="jumpLine[1]" />
    </template>
  </AnimationWorkspace>
</template>

<style>
html, body {
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
}
</style>
