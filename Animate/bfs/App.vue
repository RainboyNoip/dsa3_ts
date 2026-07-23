<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/lazy-code-editor'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { formatAnimationRunError, isAnimationBudgetExceeded } from '@/animation/animationBudget'
import { isAnimationWorkerError, runAnimationInWorker, shouldUseAnimationWorker } from '@/animation/animationWorkerClient'
import { DEFAULT_GRAPH_INPUT_LIMITS, serializeGraphInput } from '@/animation/graphInput'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { BFS, type BFSFrame } from './bfs'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { initCytoscape } from './cyto'
import { useCytoscapeRenderer } from '../../src/animation/useCytoscapeRenderer'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))
const sampleInput = serializeGraphInput(defaultGraphData[0].nodes, defaultGraphData[0].edges, GraphType.undigraph)
const inputRules = { allowWeights: false, ...DEFAULT_GRAPH_INPUT_LIMITS }

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const bfs = ref(new BFS())
const renderer = useCytoscapeRenderer(cyContainer, initCytoscape)

const player = useAnimationPlayer()
const {
    currentFrame,
} = player

const log = ref('')
const jumpLine = ref<[number, number]>([-1, -1])
let initSequence = 0

const applyFrame = (index: number): void => {
    if (index <= 0) {
        renderer.applyFrame(null)
        jumpLine.value = [-1, -1]
        log.value = ''
        return
    }

    const frame = bfs.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = async (nodes: NodeDefinition[], edges: EdgeDefinition[]): Promise<void> => {
    const sequence = ++initSequence
    if (!renderer.mount(nodes, edges)) return

    graph.value.readFromCytoscape(nodes, edges)
    bfs.value.clear()
    bfs.value.set_graph(graph.value as Graph)
    bfs.value.set_pointJumpInfo(point_jump_info)
    player.setFrameCount(0)
    player.reset()
    applyFrame(0)
    try {
        if (shouldUseAnimationWorker(nodes.length, edges.length)) {
            const frames = await runAnimationInWorker<BFSFrame>({
                algorithm: 'bfs',
                graphType: GraphType.undigraph,
                nodes,
                edges,
                jumpInfo: point_jump_info,
            })
            if (sequence !== initSequence) return
            bfs.value.set_frames(frames)
        } else {
            bfs.value.run_bfs()
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
    player.setFrameCount(bfs.value.frame_cnt)
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

const queue = computed(() => currentFrame.value <= 0 ? [] : bfs.value.get_frame(currentFrame.value).que)
const visitedList = computed(() => currentFrame.value <= 0 ? [] : bfs.value.get_frame(currentFrame.value).visited)
const poppedList = computed(() => currentFrame.value <= 0 ? [] : bfs.value.get_frame(currentFrame.value).poped)
const headNode = computed(() => currentFrame.value <= 0 ? null : bfs.value.get_frame(currentFrame.value).head)

const applyInputGraph = (inputGraph: Graph): void => {
    initGraph(inputGraph.all_nodes, inputGraph.all_edges)
}
</script>

<template>
  <AnimationWorkspace
    v-model:selected-graph="selectedGraph"
    title="BFS 遍历"
    :player="player"
    :graph-options="defaultGraphSelectorOptions"
    :graph-type="GraphType.undigraph"
    :sample-input="sampleInput"
    :input-rules="inputRules"
    @input-data="applyInputGraph"
    @relayout="renderer.relayout"
  >
    <template #state>
      <div class="mt-2" v-if="headNode !== null">
        <span class="me-2">当前取出:</span>
        <span class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ headNode }}</span>
      </div>
      <div class="mt-1">
        <span class="me-2">队列:</span>
        <span v-for="item in queue" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
      </div>
      <div class="mt-1">
        <span class="me-2">已访问:</span>
        <span v-for="item in visitedList" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
      </div>
      <div class="mt-1">
        <span class="me-2">已弹出:</span>
        <span v-for="item in poppedList" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
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
