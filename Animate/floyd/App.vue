<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import type { EdgeDefinition, NodeDefinition } from 'cytoscape'
import AnimationWorkspace from '@/components/animation-workspace.vue'
import CodeEditor from '@/components/lazy-code-editor'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { useCytoscapeRenderer } from '@/animation/useCytoscapeRenderer'
import { serializeGraphInput } from '@/animation/graphInput'
import { GraphType, type Graph } from '@/lib/graph_ts'
import { read_raw_code } from '@/lib/read_raw_code'
import DistanceTable from './distance-table.vue'
import { runFloyd, formatDistance as fmt, type FloydMode, type FloydRun } from './floyd'
import { initCytoscape } from './cyto'
import data from './input_data/data.json'
import code3d from './code.cpp?raw'
import code2d from './code_2d.cpp?raw'

const mode = ref<FloydMode>('3d'), selectedGraph = ref(0), history = ref(-1)
const cyContainer = ref<HTMLElement | null>(null)
const renderer = useCytoscapeRenderer(cyContainer, initCytoscape)
const players = { '3d': useAnimationPlayer(), '2d': useAnimationPlayer() }
const player = computed(() => players[mode.value])
const runs = shallowRef<Record<FloydMode, FloydRun>>({ '3d': { ids: [], frames: [], layers: [] }, '2d': { ids: [], frames: [], layers: [] } })
const run = computed(() => runs.value[mode.value])
const frame = computed(() => run.value.frames[player.value.currentFrame.value])
const parsedCodes = { '3d': read_raw_code(code3d), '2d': read_raw_code(code2d) }
const code = computed(() => parsedCodes[mode.value])
const jump = computed(() => code.value.point_jump_info[frame.value?.phase ?? 'initial'] ?? [-1, -1])
const graphOptions = data.map((item, value) => ({ label: item.name, value }))
const sampleInput = serializeGraphInput(data[0].nodes, data[0].edges, GraphType.digraph)
const completedLayer = computed(() => {
  const f = frame.value
  if (!f || f.k === 0) return 0
  return f.phase === 'result' && f.i === run.value.ids.length - 1 && f.j === run.value.ids.length - 1 ? f.k : f.k - 1
})
let graphSequence = 0
async function initGraph(nodes: NodeDefinition[], edges: EdgeDefinition[]) {
  const sequence = ++graphSequence
  for (const p of Object.values(players)) p.reset()
  runs.value = { '3d': runFloyd(nodes, edges, '3d'), '2d': runFloyd(nodes, edges, '2d') }
  for (const m of ['3d', '2d'] as const) players[m].setFrameCount(Math.max(0, runs.value[m].frames.length - 1))
  history.value = -1
  await nextTick()
  if (sequence !== graphSequence) return
  renderer.mount(nodes, edges)
  renderer.applyFrame(frame.value ?? null)
}
function nextK() {
  player.value.pause()
  const next = run.value.frames.findIndex((f, index) => index > player.value.currentFrame.value && f.k > (frame.value?.k ?? 0))
  player.value.setFrame(next < 0 ? player.value.frameCount.value : next)
}
watch(mode, (_next, previous) => { players[previous].pause(); history.value = -1 })
watch(frame, f => { renderer.applyFrame(f ?? null); if (history.value > completedLayer.value) history.value = -1 })
watch(selectedGraph, index => initGraph(data[index].nodes, data[index].edges))
onMounted(() => initGraph(data[0].nodes, data[0].edges))
const inputGraph = (graph: Graph) => initGraph(graph.all_nodes, graph.all_edges)
const pathText = (path: string[]) => path.length ? path.join(' → ') : '不可达'
</script>
<template>
  <AnimationWorkspace v-model:selected-graph="selectedGraph" class="floyd-workspace" title="Floyd 全源最短路" :player="player"
    :graph-options="graphOptions" :graph-type="GraphType.digraph" :sample-input="sampleInput"
    :input-rules="{ allowWeights: true, maxNodes: 8, maxEdges: 64 }" @input-data="inputGraph" @relayout="renderer.relayout">
    <template #state>
      <div class="mode-controls" role="group" aria-label="DP 版本">
        <button :aria-pressed="mode === '3d'" @click="mode = '3d'">三维 DP · 分层</button>
        <button :aria-pressed="mode === '2d'" @click="mode = '2d'">二维 DP · 原地更新</button>
        <button :disabled="!frame || player.isAtEnd.value" @click="nextK">跳到下一个 k</button>
      </div>
      <p v-if="run.error" role="alert" class="error">{{ run.error }}</p>
      <template v-else-if="frame">
        <p v-if="mode === '3d'">dp[i][j][k]：只允许前 k 个顶点作为中间点。所有来源值取自 k−1 层。</p>
        <p v-else>dp[i][j] 原地更新：k 必须放在最外层。无负环时 dp[k][k] = 0，本轮来源行、列保持不变。</p>
        <p class="formula">{{ mode === '3d' ? 'dp[i][j][k] = min(dp[i][j][k−1], dp[i][k][k−1] + dp[k][j][k−1])' : 'dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j])' }}</p>
        <div class="calculation" aria-live="polite">
          <template v-if="frame.phase === 'initial'">初始化：对角线为 0，直接边取最小权值，其余为 ∞。k 按顶点编号从小到大推进。</template>
          <template v-else>
            <strong>k = {{ run.ids[frame.k - 1] }}，i = {{ run.ids[frame.i] }}，j = {{ run.ids[frame.j] }} · {{ frame.phase === 'compare' ? '比较' : '更新结果' }}</strong>
            <div>原距离 {{ fmt(frame.before) }}；经过 k：{{ fmt(frame.left) }} + {{ fmt(frame.right) }} = {{ fmt(frame.candidate) }}</div>
            <div v-if="frame.phase === 'result'">{{ frame.changed ? `更新：${fmt(frame.before)} → ${fmt(frame.candidate)}` : '保持不变：绕经 k 没有更短。' }}</div>
            <div class="left-text">来源① i → k：{{ pathText(frame.leftPath) }}</div>
            <div class="right-text">来源② k → j：{{ pathText(frame.rightPath) }}</div>
          </template>
        </div>
        <div class="tables" :class="{ paired: mode === '3d' }">
          <DistanceTable v-if="mode === '3d'" :matrix="frame.previous" :ids="run.ids" :title="`上一层 · k = ${Math.max(0, frame.k - 1)}`" :frame="frame" sources />
          <DistanceTable :matrix="frame.matrix" :ids="run.ids" :title="mode === '3d' ? `当前层 · k = ${frame.k}` : '当前距离表 dp[i][j]'" :frame="frame" :sources="mode === '2d'" target />
        </div>
        <p class="legend">蓝色：来源①　橙色：来源②　紫框：目标　绿色：已更新；路径重合的边显示为紫色虚线。</p>
        <p v-if="player.isAtEnd.value"><strong>计算完成：表格为所有点对的最短距离。</strong></p>
        <div v-if="mode === '3d'">
          <label>查看已完成的历史层：<select v-model.number="history" aria-label="历史 DP 层">
            <option :value="-1">收起</option><option v-for="k in completedLayer + 1" :key="k" :value="k - 1">k = {{ k - 1 }}{{ k === 1 ? '（初始化）' : '' }}</option>
          </select></label>
          <DistanceTable v-if="history >= 0" :matrix="run.layers[history]" :ids="run.ids" :title="`历史层 · k = ${history}`" />
        </div>
      </template>
    </template>
    <template #graph><div id="cy" ref="cyContainer" class="graph-canvas" aria-label="有向带权图与候选路径"></div></template>
    <template #code><CodeEditor :key="mode" :code="code.code" :hline_start="jump[0]" :hline_end="jump[1]" /></template>
  </AnimationWorkspace>
</template>
<style>
html, body { margin: 0; width: 100%; height: 100%; }
</style>
<style scoped>
.graph-canvas { height: 100%; min-height: 0; }
.mode-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
button, select { font: inherit; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: white; color: #18201f; }
button { cursor: pointer; min-height: 44px; } button[aria-pressed=true] { background: #ede9fe; border-color: #7c3aed; color: #5b21b6; } button:disabled { opacity: .5; cursor: default; }
button:focus-visible, select:focus-visible { outline: 3px solid #7c3aed; outline-offset: 2px; }
p { margin: 10px 0; font-size: 13px; line-height: 1.6; }
.formula { font-family: monospace; overflow-wrap: anywhere; }
.calculation { background: #f8fafc; border-left: 3px solid #7c3aed; padding: 10px; font-size: 13px; line-height: 1.7; }
.left-text { color: #1e40af; } .right-text { color: #9a3412; }
.tables { display: grid; gap: 12px; min-width: 0; }.paired { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.legend { color: #475569; } .error { color: #b91c1c; }
@media(min-width: 1024px) {
  .floyd-workspace :deep(.workspace-main) { grid-template-rows: minmax(0, 2fr) minmax(180px, 1fr); }
  .floyd-workspace :deep(.workspace-state) { max-height: none; height: 100%; box-sizing: border-box; }
}
@media(max-width: 600px) { .paired { grid-template-columns: minmax(0, 1fr); } }
</style>
