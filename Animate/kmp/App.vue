<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton } from 'naive-ui/es/button'

import AnimationWorkspace from '@/components/animation-workspace.vue'
import codeEditor from '@/components/lazy-code-editor'
import KMPInputDialog from '@/components/kmp-input-dialog.vue'
import { read_raw_code } from '@/lib/read_raw_code'
import { useAnimationPlayer } from '@/animation/useAnimationPlayer'
import { GraphType } from '@/lib/graph_ts'
import { KMP, type KMPCompareResult, type KMPFrame } from './kmp'
import defaultSamples from './input_data/data.json'
import rawCode from './code.cpp?raw'

const { code, point_jump_info } = read_raw_code(rawCode)
const sampleOptions = defaultSamples.map((sample, index) => ({ label: sample.name, value: index }))

const selectedSample = ref(0)
const inputDialogOpen = ref(false)
const kmp = ref(new KMP())
const player = useAnimationPlayer()
const { currentFrame } = player
const jumpLine = ref<[number, number]>([-1, -1])
const current = ref<KMPFrame>(kmp.value.get_frame(0))
let inputSequence = 0

const phaseLabels: Record<KMPFrame['phase'], string> = {
    prefix: '构建 LPS',
    search: '主串匹配',
    complete: '匹配成功',
    not_found: '未找到',
    invalid: '输入无效',
}

const phaseClass = computed(() => `is-${current.value.phase}`)
const phaseLabel = computed(() => phaseLabels[current.value.phase])
const comparisonLabel = computed(() => {
    const compare = current.value.compare
    if (!compare) return '尚未比较'
    const labels: Record<KMPCompareResult, string> = {
        equal: '相等，继续前进',
        different: '失配',
        fallback: '回退 j',
        match: '完整匹配',
    }
    return `${labels[compare.result]} · 主串 ${compare.textIndex} / 模式串 ${compare.patternIndex}`
})
const matchLabel = computed(() => current.value.matchStart === null
    ? current.value.phase === 'not_found' ? '未找到' : '等待结果'
    : `起点 ${current.value.matchStart}`)
const alignmentOffset = computed(() => {
    if (current.value.phase !== 'search' && current.value.phase !== 'complete') return 0
    return Math.max(0, current.value.i - current.value.j)
})
const isCurrentText = (index: number): boolean => (
    current.value.phase === 'search' && current.value.compare?.textIndex === index
        || current.value.phase === 'complete' && current.value.compare?.textIndex === index
)

const isCurrentPattern = (index: number): boolean => current.value.compare?.patternIndex === index

const isMatchedText = (index: number): boolean => {
    if (current.value.phase === 'complete' && current.value.matchStart !== null) {
        return index >= current.value.matchStart && index < current.value.matchStart + current.value.pattern.length
    }
    if (current.value.phase !== 'search' || current.value.j <= 0) return false
    const start = current.value.i - current.value.j
    return index >= start && index < current.value.i
}

const isMatchedPattern = (index: number): boolean => {
    if (current.value.phase === 'complete') return true
    return current.value.phase === 'search' && index < current.value.j
}

const updateCurrentFrame = (index: number): void => {
    current.value = kmp.value.get_frame(index)
    jumpLine.value = [...current.value.jump]
}

const runInput = (text: string, pattern: string): void => {
    inputSequence += 1
    const sequence = inputSequence
    kmp.value = new KMP()
    kmp.value.set_input(text, pattern)
    kmp.value.set_pointJumpInfo(point_jump_info)
    player.setFrameCount(0)
    player.reset()
    updateCurrentFrame(0)

    kmp.value.run()
    if (sequence !== inputSequence) return
    player.setFrameCount(kmp.value.frame_cnt)
    player.reset()
    updateCurrentFrame(0)
}

const applySample = (index: number): void => {
    const sample = defaultSamples[index]
    if (sample) runInput(sample.text, sample.pattern)
}

const applyCustomInput = (value: { text: string; pattern: string }): void => {
    selectedSample.value = -1
    runInput(value.text, value.pattern)
}

watch(selectedSample, (next, previous) => {
    if (next === previous || next < 0) return
    applySample(next)
})

watch(currentFrame, (frame) => updateCurrentFrame(frame))

onMounted(() => applySample(selectedSample.value))
</script>

<template>
  <AnimationWorkspace
    title="KMP 字符串匹配"
    :player="player"
    :graph-options="[]"
    :selected-graph="0"
    :graph-type="GraphType.undigraph"
    sample-input="1 0"
    :show-data-toolbar="false"
  >
    <template #state>
      <div class="kmp-state-toolbar">
        <select v-model.number="selectedSample" class="kmp-sample-select" aria-label="选择字符串样例">
          <option v-for="option in sampleOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
          <option :value="-1">自定义字符串</option>
        </select>
        <n-button aria-label="输入字符串" @click="inputDialogOpen = true">输入字符串</n-button>
      </div>

      <div class="kmp-status-grid" :class="phaseClass">
        <div class="kmp-status-item">
          <span>阶段</span>
          <strong>{{ phaseLabel }}</strong>
        </div>
        <div class="kmp-status-item">
          <span>指针</span>
          <strong>i = {{ current.i }}，j = {{ current.j }}</strong>
        </div>
        <div class="kmp-status-item">
          <span>比较</span>
          <strong>{{ comparisonLabel }}</strong>
        </div>
        <div class="kmp-status-item">
          <span>结果</span>
          <strong>{{ matchLabel }}</strong>
        </div>
      </div>

      <div class="kmp-lps-panel">
        <div class="kmp-panel-heading">
          <strong>LPS / 前缀表</strong>
          <span>{{ current.lps.length }} 项</span>
        </div>
        <div class="kmp-lps-table" role="table" aria-label="LPS 前缀表">
          <div class="kmp-lps-row" role="row">
            <span v-for="(_, index) in current.pattern" :key="`index-${index}`" class="kmp-lps-cell kmp-lps-index" role="cell">{{ index }}</span>
          </div>
          <div class="kmp-lps-row" role="row">
            <span v-for="(_, index) in current.pattern" :key="`char-${index}`" class="kmp-lps-cell" role="cell">{{ current.pattern[index] }}</span>
          </div>
          <div class="kmp-lps-row" role="row">
            <span v-for="(value, index) in current.lps" :key="`lps-${index}`" class="kmp-lps-cell kmp-lps-value" role="cell">{{ value }}</span>
          </div>
        </div>
      </div>

      <p class="kmp-log" :class="phaseClass">{{ current.log }}</p>
    </template>

    <template #graph>
      <div class="kmp-graph" aria-label="KMP 字符串匹配可视化">
        <div class="kmp-graph-heading">
          <div>
            <span class="kmp-graph-kicker">STRING MATCHING</span>
            <strong>字符对齐</strong>
          </div>
          <span class="kmp-graph-count">{{ current.text.length }} + {{ current.pattern.length }}</span>
        </div>

        <div class="kmp-string-stage">
          <div class="kmp-string-row">
            <span class="kmp-row-label">主串</span>
            <div class="kmp-track">
              <span
                v-for="(character, index) in current.text"
                :key="`text-${index}`"
                class="kmp-char"
                :class="{ 'is-current': isCurrentText(index), 'is-matched': isMatchedText(index) }"
              >
                <small>{{ index }}</small>
                <b>{{ character === ' ' ? '·' : character }}</b>
              </span>
              <span v-if="current.text.length === 0" class="kmp-empty-string">空字符串</span>
            </div>
          </div>

          <div class="kmp-string-row kmp-pattern-row">
            <span class="kmp-row-label">模式串</span>
            <div class="kmp-track" :style="{ paddingLeft: `${alignmentOffset * 2.75}rem` }">
              <span
                v-for="(character, index) in current.pattern"
                :key="`pattern-${index}`"
                class="kmp-char"
                :class="{ 'is-current': isCurrentPattern(index), 'is-matched': isMatchedPattern(index) }"
              >
                <small>{{ index }}</small>
                <b>{{ character === ' ' ? '·' : character }}</b>
              </span>
              <span v-if="current.pattern.length === 0" class="kmp-empty-string">空模式串</span>
            </div>
          </div>
        </div>

        <div class="kmp-legend" aria-label="字符状态图例">
          <span><i class="is-current"></i>当前比较</span>
          <span><i class="is-matched"></i>已匹配</span>
          <span><i class="is-fallback"></i>回退</span>
        </div>
      </div>
    </template>

    <template #code>
      <code-editor :code="code" :hline_start="jumpLine[0]" :hline_end="jumpLine[1]" />
    </template>
  </AnimationWorkspace>

  <KMPInputDialog
    v-model:show="inputDialogOpen"
    :text="current.text"
    :pattern="current.pattern"
    @submit="applyCustomInput"
  />
</template>

<style>
html, body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.kmp-state-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.kmp-sample-select {
  width: min(14rem, 100%);
  min-height: 36px;
  border: 1px solid #cfd8d4;
  border-radius: 4px;
  padding: 0 0.75rem;
  background: #fff;
  color: #18201f;
  font: inherit;
}

.kmp-sample-select:focus-visible {
  outline: 3px solid rgb(23 107 91 / 30%);
  outline-offset: 1px;
}

.kmp-status-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.kmp-status-item {
  min-width: 0;
  border-left: 3px solid #dfe5e2;
  padding: 7px 9px;
  background: #f7f9f8;
}

.kmp-status-item span,
.kmp-status-item strong {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
}

.kmp-status-item span {
  color: #68716f;
  font-size: 0.72rem;
  font-weight: 650;
}

.kmp-status-item strong {
  margin-top: 3px;
  color: #18201f;
  font-size: 0.82rem;
  line-height: 1.35;
}

.kmp-status-grid.is-prefix .kmp-status-item:first-child { border-left-color: #3157a4; }
.kmp-status-grid.is-search .kmp-status-item:first-child { border-left-color: #176b5b; }
.kmp-status-grid.is-complete .kmp-status-item:first-child { border-left-color: #26834b; }
.kmp-status-grid.is-not_found .kmp-status-item:first-child,
.kmp-status-grid.is-invalid .kmp-status-item:first-child { border-left-color: #c24b32; }

.kmp-lps-panel {
  min-width: 0;
  margin-top: 14px;
  border-top: 1px solid #dfe5e2;
  padding-top: 12px;
}

.kmp-panel-heading,
.kmp-graph-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.kmp-panel-heading strong {
  color: #18201f;
  font-size: 0.84rem;
}

.kmp-panel-heading span,
.kmp-graph-count {
  color: #8c9692;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.72rem;
}

.kmp-lps-table {
  min-width: max-content;
  margin-top: 8px;
  overflow-x: auto;
}

.kmp-lps-row {
  display: flex;
  min-width: max-content;
}

.kmp-lps-cell {
  min-height: 29px;
  border-top: 1px solid #dfe5e2;
  border-left: 1px solid #dfe5e2;
  padding: 5px 3px;
  color: #18201f;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.75rem;
  text-align: center;
}

.kmp-lps-index {
  color: #8c9692;
}

.kmp-lps-value {
  border-bottom: 1px solid #dfe5e2;
  color: #176b5b;
  font-weight: 750;
}

.kmp-log {
  min-height: 2.75rem;
  margin: 14px 0 0;
  border-left: 3px solid #dfe5e2;
  padding: 8px 10px;
  background: #f7f9f8;
  color: #4d5855;
  font-size: 0.8rem;
  line-height: 1.45;
}

.kmp-log.is-complete { border-left-color: #26834b; color: #1d6a3b; }
.kmp-log.is-not_found,
.kmp-log.is-invalid { border-left-color: #c24b32; color: #9a3927; }

.kmp-graph {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  padding: clamp(14px, 2vw, 24px);
  background: #fff;
}

.kmp-graph-kicker {
  display: block;
  margin-bottom: 4px;
  color: #176b5b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.kmp-graph-heading strong {
  color: #18201f;
  font-size: 1.1rem;
}

.kmp-string-stage {
  min-width: 0;
  margin-top: clamp(28px, 6vh, 72px);
  overflow-x: auto;
  padding-bottom: 12px;
}

.kmp-string-row {
  display: flex;
  min-width: max-content;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.kmp-row-label {
  width: 3.4rem;
  flex: 0 0 3.4rem;
  color: #68716f;
  font-size: 0.78rem;
  font-weight: 750;
  text-align: right;
}

.kmp-track {
  display: flex;
  min-height: 4.2rem;
  align-items: stretch;
  gap: 4px;
}

.kmp-char {
  display: flex;
  width: 2.5rem;
  min-width: 2.5rem;
  height: 4.2rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe5e2;
  border-radius: 4px;
  background: #fff;
  color: #18201f;
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease;
}

.kmp-char small {
  color: #8c9692;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 0.62rem;
  line-height: 1;
}

.kmp-char b {
  margin-top: 5px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 1.1rem;
  line-height: 1;
}

.kmp-char.is-matched {
  border-color: #97c9b1;
  background: #edf7f1;
  color: #176b5b;
}

.kmp-char.is-current {
  border-color: #176b5b;
  box-shadow: 0 0 0 2px rgb(23 107 91 / 16%);
  transform: translateY(-3px);
}

.kmp-char.is-current.is-matched {
  background: #dff1e7;
}

.kmp-empty-string {
  display: inline-flex;
  min-height: 4.2rem;
  align-items: center;
  color: #8c9692;
  font-size: 0.8rem;
}

.kmp-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: auto;
  padding-top: 20px;
  color: #68716f;
  font-size: 0.72rem;
}

.kmp-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.kmp-legend i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid #dfe5e2;
  border-radius: 3px;
  background: #fff;
}

.kmp-legend i.is-current { border-color: #176b5b; box-shadow: 0 0 0 2px rgb(23 107 91 / 16%); }
.kmp-legend i.is-matched { border-color: #97c9b1; background: #edf7f1; }
.kmp-legend i.is-fallback { border-color: #bd86b7; background: #f8eef7; }

@media (max-width: 767px) {
  .kmp-status-grid {
    grid-template-columns: 1fr;
  }

  .kmp-sample-select {
    min-height: 44px;
  }

  .kmp-state-toolbar :deep(.n-button) {
    min-height: 44px;
  }

  .kmp-graph {
    padding: 14px;
  }
}
</style>
