<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/lazy-code-editor'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { formatAnimationRunError, isAnimationBudgetExceeded } from '@/animation/animationBudget'
import { isAnimationWorkerError, runAnimationInWorker, shouldUseAnimationWorker } from '@/animation/animationWorkerClient'
import { HIERHOLZER_GRAPH_INPUT_LIMITS, serializeGraphInput } from '@/animation/graphInput'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { Hierholzer, type HierholzerFrame } from './hierholzer'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))
const sampleInput = serializeGraphInput(defaultGraphData[0].nodes, defaultGraphData[0].edges, GraphType.undigraph)
const inputRules = {
    allowWeights: false,
    // 连通性属于判定阶段，交给动画展示，所以这里不提前拦截
    requireConnected: false,
    ...HIERHOLZER_GRAPH_INPUT_LIMITS,
}

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const hierholzerAlgorithm = ref(new Hierholzer())
const renderer = useCytoscapeRenderer(cyContainer, initCytoscape)
const player = useAnimationPlayer()
const {
    currentFrame,
} = player

const jumpLine = ref<[number, number]>([-1, -1])
const log = ref('')
const stack = ref<number[]>([])
const path = ref<number[]>([])
let initSequence = 0

const formatList = (values: number[]): string => values.length > 0 ? values.join(' ') : '（空）'

const applyFrame = (index: number): void => {
    if (index <= 0) {
        renderer.applyFrame(null)
        jumpLine.value = [-1, -1]
        log.value = ''
        stack.value = []
        path.value = []
        return
    }

    const frame = hierholzerAlgorithm.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
    stack.value = [...frame.stack]
    path.value = [...frame.path]
}

const initGraph = async (nodes: NodeDefinition[], edges: EdgeDefinition[]): Promise<void> => {
    const sequence = ++initSequence
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    hierholzerAlgorithm.value.clear()
    hierholzerAlgorithm.value.set_graph(graph.value as Graph)
    hierholzerAlgorithm.value.set_pointJumpInfo(point_jump_info)
    player.setFrameCount(0)
    player.reset()
    applyFrame(0)
    try {
        if (shouldUseAnimationWorker(nodes.length, edges.length)) {
            const frames = await runAnimationInWorker<HierholzerFrame>({
                algorithm: 'hierholzer',
                graphType: GraphType.undigraph,
                nodes,
                edges,
                jumpInfo: point_jump_info,
            })
            if (sequence !== initSequence) return
            hierholzerAlgorithm.value.set_frames(frames)
        } else {
            hierholzerAlgorithm.value.run()
        }
    } catch (error) {
        if (sequence !== initSequence) return
        if (!isAnimationBudgetExceeded(error) && !isAnimationWorkerError(error)) throw error
        player.setFrameCount(0)
        player.reset()
        applyFrame(0)
        log.value = formatAnimationRunError(error)
        return
    }
    if (sequence !== initSequence) return
    player.setFrameCount(hierholzerAlgorithm.value.frame_cnt)
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
    title="Hierholzer 算法"
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
      <div class="m-1 mt-3">
        <span class="font-bold">stack_path：</span>
        <span class="font-mono">{{ formatList(stack) }}</span>
      </div>
      <div class="m-1">
        <span class="font-bold">path：</span>
        <span class="font-mono">{{ formatList(path) }}</span>
      </div>
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
