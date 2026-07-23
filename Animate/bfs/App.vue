<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NButtonGroup, NFlex, NProgress, NSelect } from 'naive-ui'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import SpliteLayout from '../../src/components/splite_layout_unocss.vue'
import codeEditor from '@/components/code-editor.vue'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { BFS } from './bfs'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { initCytoscape } from './cyto'
import { useCytoscapeRenderer } from '../../src/animation/useCytoscapeRenderer'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const bfs = ref(new BFS())
const renderer = useCytoscapeRenderer(cyContainer, initCytoscape)

const player = useAnimationPlayer()
const {
    currentFrame,
    frameCount,
    progress,
    isAtStart,
    isAtEnd,
    previousFrame,
    nextFrame,
} = player

const log = ref('')
const jumpLine = ref<[number, number]>([-1, -1])

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

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return

    graph.value.readFromCytoscape(nodes, edges)
    bfs.value.clear()
    bfs.value.set_graph(graph.value as Graph)
    bfs.value.set_pointJumpInfo(point_jump_info)
    bfs.value.run_bfs()
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

const getInputData = (): void => {
    alert('TODO')
}
</script>

<template>
  <div class="container mx-auto py-2 box-border h-full">
    <SpliteLayout>
      <template #top>
        <div class="flex justify-center items-center gap-3">
          <n-button-group>
            <n-button :disabled="isAtStart" aria-label="上一帧" @click="previousFrame">
              <Icon icon="fluent:previous-16-regular" width="15" height="15" />
            </n-button>
            <n-button ghost :disabled="isAtEnd" aria-label="下一帧" @click="nextFrame">
              <Icon icon="fluent:next-16-regular" width="15" height="15" />
            </n-button>
          </n-button-group>
          <n-progress type="line" :percentage="progress">
            {{ currentFrame }}/{{ frameCount }}
          </n-progress>
        </div>
      </template>

      <template #left>
        <div class="flex flex-col h-full">
          <div class="card-1 p-2 grow-0">
            <n-flex>
              <n-select v-model:value="selectedGraph" :options="defaultGraphSelectorOptions" style="width: 200px" />
              <n-button @click="getInputData">输入数据</n-button>
            </n-flex>
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
          </div>
          <div id="cy" ref="cyContainer" class="grow"></div>
        </div>
      </template>

      <template #right>
        <code-editor :code="code" :hline_start="jumpLine[0]" :hline_end="jumpLine[1]" />
      </template>
    </SpliteLayout>
  </div>
</template>

<style>
html, body {
  padding: 0;
  margin: 0;
  width: 100vw;
  height: 100vh;
}
</style>
