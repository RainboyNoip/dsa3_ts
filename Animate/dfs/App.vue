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
import { DFS } from './dfs'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.undigraph))
const dfs = ref(new DFS())
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

    const frame = dfs.value.get_frame(index)
    renderer.applyFrame(frame)
    jumpLine.value = [...frame.jump]
    log.value = frame.log
}

const initGraph = (nodes: NodeDefinition[], edges: EdgeDefinition[]): void => {
    if (!renderer.mount(nodes, edges)) return
    graph.value.readFromCytoscape(nodes, edges)
    dfs.value.clear()
    dfs.value.set_graph(graph.value as Graph)
    dfs.value.set_pointJumpInfo(point_jump_info)
    dfs.value.run_dfs()
    player.setFrameCount(dfs.value.frame_cnt)
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

const dfnList = computed(() => currentFrame.value <= 0 ? [] : dfs.value.get_frame(currentFrame.value).dfn)

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
            <div class="mt-2">
              <span class="me-2">DFS 序:</span>
              <table>
                <thead>
                  <tr>
                    <th>访问顺序</th>
                    <th v-for="(_, index) in dfnList" :key="index">{{ index + 1 }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>节点</th>
                    <td v-for="node in dfnList" :key="node">{{ node }}</td>
                  </tr>
                </tbody>
              </table>
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
