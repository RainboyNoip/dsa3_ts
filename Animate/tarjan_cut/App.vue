<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NFlex, NSelect } from 'naive-ui'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import SpliteLayout from '../../src/components/splite_layout_unocss.vue'
import codeEditor from '@/components/code-editor.vue'
import AnimationControls from '@/components/animation-controls.vue'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { TarjanCut } from './tarjan'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const tarjanCut = ref(new TarjanCut())
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

    const frame = tarjanCut.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    tarjanCut.value.clear()
    tarjanCut.value.set_graph(graph.value as Graph)
    tarjanCut.value.set_pointJumpInfo(point_jump_info)
    tarjanCut.value.run()
    player.setFrameCount(tarjanCut.value.frame_cnt)
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

const frame = computed(() => tarjanCut.value.get_frame(currentFrame.value))
const nodeIds = computed(() => frame.value.node_ids)
const dfnList = computed(() => frame.value.dfn)
const lowList = computed(() => frame.value.low)
const cutNodes = computed(() => frame.value.cut_nodes)

const getInputData = (): void => {
    alert('TODO')
}
</script>

<template>
  <div class="container mx-auto py-2 box-border h-full">
    <SpliteLayout>
      <template #top>
        <AnimationControls :player="player" />
      </template>

      <template #left>
        <div class="flex flex-col h-full">
          <div class="card-1 p-2 grow-0">
            <n-flex>
              <n-select v-model:value="selectedGraph" :options="defaultGraphSelectorOptions" style="width: 200px" />
              <n-button @click="getInputData">输入数据</n-button>
            </n-flex>
            <div class="mt-2 overflow-auto">
              <span class="me-2">dfn / low 表:</span>
              <table>
                <thead>
                  <tr>
                    <th>节点</th>
                    <th v-for="node in nodeIds" :key="node">{{ node }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>dfn</th>
                    <td v-for="(value, index) in dfnList" :key="nodeIds[index]">{{ value }}</td>
                  </tr>
                  <tr>
                    <th>low</th>
                    <td v-for="(value, index) in lowList" :key="nodeIds[index]">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-2">
              <span class="me-2">割点:</span>
              <span v-for="item in cutNodes" :key="item" class="border-1 border-solid border-gray-500 rounded px-2 me-2">{{ item }}</span>
              <span v-if="cutNodes.length === 0" class="text-gray-400">(未发现)</span>
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
