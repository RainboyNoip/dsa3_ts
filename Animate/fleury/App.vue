<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/lazy-code-editor'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { formatAnimationBudgetError, isAnimationBudgetExceeded } from '@/animation/animationBudget'
import { FLEURY_GRAPH_INPUT_LIMITS, serializeGraphInput } from '@/animation/graphInput'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { fleury } from './fleury'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))
const sampleInput = serializeGraphInput(defaultGraphData[0].nodes, defaultGraphData[0].edges, GraphType.undigraph)
const inputRules = {
    allowWeights: false,
    requireConnected: true,
    ...FLEURY_GRAPH_INPUT_LIMITS,
}

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const fleuryAlgorithm = ref(new fleury())
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

    const frame = fleuryAlgorithm.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    fleuryAlgorithm.value.clear()
    fleuryAlgorithm.value.set_graph(graph.value as Graph)
    fleuryAlgorithm.value.set_pointJumpInfo(point_jump_info)
    try {
        fleuryAlgorithm.value.run()
    } catch (error) {
        if (!isAnimationBudgetExceeded(error)) throw error
        player.setFrameCount(0)
        player.reset()
        applyFrame(0)
        log.value = formatAnimationBudgetError(error)
        return
    }
    player.setFrameCount(fleuryAlgorithm.value.frame_cnt)
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

const applyInputGraph = (inputGraph: Graph): void => {
    initGraph(inputGraph.all_nodes, inputGraph.all_edges)
}
</script>

<template>
  <AnimationWorkspace
    v-model:selected-graph="selectedGraph"
    title="Fleury 算法"
    :player="player"
    :graph-options="defaultGraphSelectorOptions"
    :graph-type="GraphType.undigraph"
    :sample-input="sampleInput"
    :input-rules="inputRules"
    @input-data="applyInputGraph"
    @relayout="renderer.relayout"
  >
    <template #state>
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
