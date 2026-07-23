<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NButtonGroup, NFlex, NProgress, NSelect } from 'naive-ui'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'

import SpliteLayout from '../../src/components/splite_layout_unocss.vue'
import codeEditor from '@/components/code-editor.vue'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import rawCode from './code.cpp?raw'
import defaultGraphData from './input_data/data.json'
import { Dfsscc } from './dfsscc'
import { Graph, GraphType } from '../../src/lib/graph_ts'
import { initCytoscape } from './cyto'

const { code, point_jump_info } = read_raw_code(rawCode)
const defaultGraphSelectorOptions = defaultGraphData.map((item, index) => ({ label: item.name, value: index }))

const cyContainer = ref<HTMLElement | null>(null)
const selectedGraph = ref(0)
const graph = ref(new Graph(GraphType.digraph))
const dfsscc = ref(new Dfsscc(graph.value as Graph, point_jump_info))
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
    dfsscc.value.run_dfsscc()
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
        <div class="relative flex flex-col h-full">
          <div class="card-1 p-2 grow-0">
            <n-flex>
              <n-select v-model:value="selectedGraph" :options="defaultGraphSelectorOptions" style="width: 200px" />
              <n-button @click="getInputData">输入数据</n-button>
            </n-flex>
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
          </div>
          <div class="card-1 absolute top-80 right-5 p-2 z-1000 bg-blueGray-100 bg-op-80">
            <h3 class="my-2 text-center">栈</h3>
            <div class="flex flex-col flex-col-reverse">
              <span v-for="item in stackList" :key="item" class="border-1 border-solid border-gray-500 rounded px-5">{{ item }}</span>
            </div>
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
