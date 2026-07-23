<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/lazy-code-editor'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { formatAnimationBudgetError, isAnimationBudgetExceeded } from '@/animation/animationBudget'
import { DEFAULT_GRAPH_INPUT_LIMITS, serializeGraphInput } from '@/animation/graphInput'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Dfsscc } from './dfsscc'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))
const sampleInput = serializeGraphInput(defaultGraphData[0].nodes, defaultGraphData[0].edges, GraphType.digraph)
const inputRules = { allowWeights: false, ...DEFAULT_GRAPH_INPUT_LIMITS }

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.digraph))
const dfsscc = ref(new Dfsscc(graph.value as Graph, point_jump_info))
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

    const frame = dfsscc.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    dfsscc.value = new Dfsscc(graph.value as Graph, point_jump_info)
    try {
        dfsscc.value.run_dfsscc()
    } catch (error) {
        if (!isAnimationBudgetExceeded(error)) throw error
        player.setFrameCount(0)
        player.reset()
        applyFrame(0)
        log.value = formatAnimationBudgetError(error)
        return
    }
    player.setFrameCount(dfsscc.value.frame_cnt)
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

const frame = computed(() => dfsscc.value.get_frame(currentFrame.value))
const nodeIds = computed(() => frame.value.node_ids)
const colorList = computed(() => frame.value.color)
const stackList = computed(() => frame.value.stack)
const dfnList = computed(() => frame.value.dfn)
const lowList = computed(() => frame.value.low)

const applyInputGraph = (inputGraph: Graph): void => {
    initGraph(inputGraph.all_nodes, inputGraph.all_edges)
}
</script>

<template>
  <AnimationWorkspace
    v-model:selected-graph="selectedGraph"
    title="强连通分量"
    :player="player"
    :graph-options="defaultGraphSelectorOptions"
    :graph-type="GraphType.digraph"
    :sample-input="sampleInput"
    :input-rules="inputRules"
    @input-data="applyInputGraph"
    @relayout="renderer.relayout"
  >
    <template #state>
      <div class="mt-2 overflow-auto">
        <table>
          <thead>
            <tr>
              <th>节点</th>
              <th v-for="node in nodeIds" :key="node">{{ node }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>color</th>
              <td v-for="(item, index) in colorList" :key="nodeIds[index]">{{ item }}</td>
            </tr>
            <tr>
              <th>dfn</th>
              <td v-for="(item, index) in dfnList" :key="nodeIds[index]">{{ item }}</td>
            </tr>
            <tr>
              <th>low</th>
              <td v-for="(item, index) in lowList" :key="nodeIds[index]">{{ item }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="m-1 mt-3">{{ log }}</div>
    </template>

    <template #graph>
      <div class="relative h-full min-h-0">
        <div class="card-1 absolute top-4 right-5 z-1000 bg-blueGray-100 bg-op-80 p-2">
          <h3 class="my-2 text-center">栈</h3>
          <div class="flex flex-col flex-col-reverse">
            <span v-for="item in stackList" :key="item" class="border-1 border-solid border-gray-500 rounded px-5">{{ item }}</span>
          </div>
        </div>
        <div id="cy" ref="cyContainer" class="h-full min-h-0"></div>
      </div>
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
