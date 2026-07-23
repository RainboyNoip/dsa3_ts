<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton } from 'naive-ui/es/button'
import type { AnimationPlayer } from '@/animation/useAnimationPlayer'
import type { Graph } from '@/lib/graph_ts'
import { GraphType } from '@/lib/graph_ts'
import type { GraphInputRules } from '@/animation/graphInput'
import AnimationControls from '@/components/animation-controls.vue'
import AnimationInputDialog from '@/components/animation-input-dialog.vue'
import { animationIcons } from '@/components/animation-icons'

type GraphOption = {
    label: string
    value: number
}

type WorkspacePanel = 'graph' | 'code' | 'state'

const panels: Array<{ id: WorkspacePanel; label: string }> = [
    { id: 'graph', label: '图' },
    { id: 'code', label: '代码' },
    { id: 'state', label: '状态' },
]

const props = defineProps<{
    title: string
    player: AnimationPlayer
    graphOptions: GraphOption[]
    selectedGraph: number
    graphType: GraphType
    sampleInput: string
    inputRules?: GraphInputRules
}>()

const emit = defineEmits<{
    'update:selectedGraph': [value: number]
    'input-data': [graph: Graph]
    relayout: []
}>()

const selectedGraphValue = computed({
    get: () => props.selectedGraph,
    set: (value: number) => emit('update:selectedGraph', value),
})
const inputDialogOpen = ref(false)
const activePanel = ref<WorkspacePanel>('graph')
const mobileQuery = '(max-width: 767px)'
const isMobile = ref(typeof window !== 'undefined' && window.matchMedia(mobileQuery).matches)
const tabList = ref<HTMLElement | null>(null)
const workspaceMain = ref<HTMLElement | null>(null)
const leftWidth = ref(60)
const resizing = ref(false)
let mobileMedia: MediaQueryList | null = null

const goHome = (): void => {
    window.location.assign(import.meta.env.BASE_URL)
}

const syncMobile = (event?: MediaQueryListEvent): void => {
    isMobile.value = event?.matches ?? mobileMedia?.matches ?? false
}

const selectPanel = (panel: WorkspacePanel, focus = false): void => {
    activePanel.value = panel
    if (focus) {
        void nextTick(() => {
            tabList.value
                ?.querySelector<HTMLButtonElement>(`[data-panel="${panel}"]`)
                ?.focus()
        })
    }
}

const handleTabKeydown = (event: KeyboardEvent, panel: WorkspacePanel): void => {
    const currentIndex = panels.findIndex((item) => item.id === panel)
    let nextIndex = currentIndex
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % panels.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + panels.length) % panels.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = panels.length - 1
    else return

    event.preventDefault()
    selectPanel(panels[nextIndex].id, true)
}

const splitStyle = computed(() => ({
    '--workspace-left-width': `${leftWidth.value}%`,
}))

const setLeftWidth = (width: number): void => {
    const availableWidth = workspaceMain.value?.getBoundingClientRect().width ?? 0
    const maxByCodePanel = availableWidth > 0
        ? ((availableWidth - 352 - 4) / availableWidth) * 100
        : 75
    leftWidth.value = Math.min(Math.min(75, maxByCodePanel), Math.max(35, width))
}

const updateLeftWidth = (clientX: number): void => {
    if (!workspaceMain.value) return
    const bounds = workspaceMain.value.getBoundingClientRect()
    const nextWidth = ((clientX - bounds.left) / bounds.width) * 100
    setLeftWidth(nextWidth)
}

const beginResize = (event: PointerEvent): void => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    resizing.value = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    updateLeftWidth(event.clientX)
}

const moveResize = (event: PointerEvent): void => {
    if (resizing.value) updateLeftWidth(event.clientX)
}

const finishResize = (event: PointerEvent): void => {
    if (!resizing.value) return
    resizing.value = false
    const target = event.currentTarget as HTMLElement
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
}

const handleResizeKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft') setLeftWidth(leftWidth.value - 2)
    else if (event.key === 'ArrowRight') setLeftWidth(leftWidth.value + 2)
    else if (event.key === 'Home') setLeftWidth(35)
    else if (event.key === 'End') setLeftWidth(75)
    else return
    event.preventDefault()
}

onMounted(() => {
    mobileMedia = window.matchMedia(mobileQuery)
    syncMobile()
    mobileMedia.addEventListener('change', syncMobile)
})

onBeforeUnmount(() => mobileMedia?.removeEventListener('change', syncMobile))
</script>

<template>
  <div class="animation-workspace">
    <header class="workspace-header card-1">
      <div class="workspace-title-row">
        <n-button
          quaternary
          circle
          aria-label="返回首页"
          title="返回首页"
          @click="goHome"
        >
          <Icon :icon="animationIcons.back" width="16" height="16" />
        </n-button>
        <h1>{{ title }}</h1>
      </div>
      <AnimationControls class="workspace-controls" :player="player" />
    </header>

    <div
      v-if="isMobile"
      ref="tabList"
      class="workspace-tabs card-1"
      role="tablist"
      aria-label="动画工作区视图"
    >
      <button
        v-for="panel in panels"
        :id="`workspace-tab-${panel.id}`"
        :key="panel.id"
        type="button"
        role="tab"
        :data-panel="panel.id"
        :aria-selected="activePanel === panel.id"
        :aria-controls="`workspace-panel-${panel.id}`"
        :tabindex="activePanel === panel.id ? 0 : -1"
        @click="selectPanel(panel.id)"
        @keydown="handleTabKeydown($event, panel.id)"
      >
        {{ panel.label }}
      </button>
    </div>

    <main ref="workspaceMain" class="workspace-main" :style="splitStyle">
      <section
        v-show="!isMobile || activePanel === 'state'"
        id="workspace-panel-state"
        class="workspace-panel workspace-state card-1"
        :role="isMobile ? 'tabpanel' : undefined"
        :aria-labelledby="isMobile ? 'workspace-tab-state' : undefined"
        :tabindex="isMobile ? 0 : undefined"
      >
        <div class="workspace-toolbar">
          <select v-model.number="selectedGraphValue" class="workspace-select" aria-label="选择图数据">
            <option v-for="option in graphOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <n-button @click="inputDialogOpen = true">输入数据</n-button>
          <n-button
            quaternary
            circle
            aria-label="重新布局"
            title="重新布局"
            @click="emit('relayout')"
          >
            <Icon :icon="animationIcons.clockwise" width="16" height="16" />
          </n-button>
        </div>
        <div class="workspace-state-content">
          <slot name="state" />
        </div>
      </section>

      <section
        v-show="!isMobile || activePanel === 'graph'"
        id="workspace-panel-graph"
        class="workspace-panel workspace-graph card-1"
        :role="isMobile ? 'tabpanel' : undefined"
        :aria-labelledby="isMobile ? 'workspace-tab-graph' : undefined"
        :tabindex="isMobile ? 0 : undefined"
      >
        <slot name="graph" />
      </section>

      <section
        v-if="!isMobile || activePanel === 'code'"
        id="workspace-panel-code"
        class="workspace-panel workspace-code card-1"
        :role="isMobile ? 'tabpanel' : undefined"
        :aria-labelledby="isMobile ? 'workspace-tab-code' : undefined"
        :tabindex="isMobile ? 0 : undefined"
      >
        <slot name="code" />
      </section>

      <div
        v-if="!isMobile"
        class="workspace-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="调整图与代码宽度"
        aria-valuemin="35"
        aria-valuemax="75"
        :aria-valuenow="leftWidth"
        tabindex="0"
        @pointerdown="beginResize"
        @pointermove="moveResize"
        @pointerup="finishResize"
        @pointercancel="finishResize"
        @keydown="handleResizeKeydown"
      ></div>
    </main>

    <AnimationInputDialog
      v-model:show="inputDialogOpen"
      :sample="sampleInput"
      :graph-type="graphType"
      :rules="inputRules"
      @submit="emit('input-data', $event)"
    />
  </div>
</template>

<style scoped>
.animation-workspace {
  display: grid;
  box-sizing: border-box;
  width: 100%;
  height: 100dvh;
  min-height: 32rem;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 4px;
  overflow: hidden;
  padding: 8px;
  background: #fff;
}

.workspace-header {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: #fff;
}

.workspace-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.workspace-title-row h1 {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  color: #18201f;
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-controls {
  min-width: 0;
}

.workspace-tabs {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  background: #fff;
}

.workspace-tabs button {
  min-width: 0;
  min-height: 44px;
  border: 0;
  border-right: 1px solid #dfe5e2;
  background: #fff;
  color: #68716f;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 650;
}

.workspace-tabs button:last-child {
  border-right: 0;
}

.workspace-tabs button[aria-selected="true"] {
  box-shadow: inset 0 -3px 0 #176b5b;
  color: #176b5b;
}

.workspace-tabs button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 3px solid rgb(23 107 91 / 35%);
  outline-offset: -3px;
}

.workspace-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.workspace-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
  background: #fff;
}

.workspace-state {
  overflow: auto;
  padding: 10px;
  overflow-wrap: anywhere;
}

.workspace-toolbar {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.workspace-select {
  min-width: 0;
  width: min(12.5rem, 100%);
  min-height: 34px;
  border: 1px solid #cfd8d4;
  border-radius: 4px;
  padding: 0 2rem 0 0.75rem;
  background: #fff;
  color: #18201f;
  cursor: pointer;
  font: inherit;
}

.workspace-select:focus-visible {
  outline: 3px solid rgb(23 107 91 / 30%);
  outline-offset: 1px;
}

.workspace-state-content {
  min-width: 0;
}

.workspace-state-content :deep(table) {
  min-width: max-content;
}

.workspace-graph,
.workspace-code {
  overflow: hidden;
}

.workspace-resizer {
  display: none;
}

@media (max-width: 767px) {
  .workspace-header :deep(.n-button),
  .workspace-toolbar :deep(.n-button) {
    min-width: 44px;
    min-height: 44px;
  }

  .workspace-select {
    min-height: 44px;
  }
}

@media (min-width: 768px) {
  .animation-workspace {
    grid-template-rows: auto minmax(0, 1fr);
  }

  .workspace-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px;
  }

  .workspace-title-row {
    flex: 0 1 auto;
  }

  .workspace-controls {
    flex: 1 1 32rem;
  }

  .workspace-main {
    display: grid;
    grid-template-areas:
      "graph"
      "state"
      "code";
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(22rem, 3fr) auto minmax(20rem, 2fr);
    gap: 4px;
    overflow: auto;
  }

  .workspace-state {
    grid-area: state;
    height: auto;
    max-height: 22rem;
  }

  .workspace-graph {
    grid-area: graph;
    min-height: 22rem;
  }

  .workspace-code {
    grid-area: code;
    min-height: 20rem;
  }
}

@media (min-width: 1024px) {
  .workspace-main {
    grid-template-areas:
      "state code"
      "graph code";
    grid-template-columns: minmax(0, var(--workspace-left-width, 60%)) minmax(22rem, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    overflow: hidden;
  }

  .workspace-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--workspace-left-width, 60%);
    z-index: 5;
    display: block;
    width: 10px;
    cursor: col-resize;
    touch-action: none;
    transform: translateX(-5px);
  }

  .workspace-resizer::after {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 4px;
    width: 2px;
    background: #dfe5e2;
    content: "";
  }

  .workspace-resizer:hover::after,
  .workspace-resizer:focus-visible::after {
    background: #176b5b;
  }

  .workspace-resizer:focus-visible {
    outline: 3px solid rgb(23 107 91 / 35%);
    outline-offset: -1px;
  }

  .workspace-state {
    max-height: 38vh;
  }

  .workspace-graph,
  .workspace-code {
    min-height: 0;
  }
}
</style>
