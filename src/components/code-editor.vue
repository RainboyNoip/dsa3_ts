<!-- 所有算法共用的只读代码面板；阅读设置跨页面保存。 -->
<template>
  <section class="code-panel" aria-label="参考代码">
    <div class="code-toolbar" @keydown.stop>
      <span class="code-title">参考代码 <span class="code-language">C++</span></span>
      <div class="code-tools" role="group" aria-label="代码阅读设置">
        <button type="button" aria-label="减小代码字号" title="减小字号" :disabled="fontSize <= MIN_FONT_SIZE" @click="fontSize--">A−</button>
        <output class="font-size" aria-live="polite" aria-label="代码字号">{{ fontSize }} px</output>
        <button type="button" aria-label="增大代码字号" title="增大字号" :disabled="fontSize >= MAX_FONT_SIZE" @click="fontSize++">A+</button>
        <button type="button" aria-label="重置代码字号" title="恢复 15 px" :disabled="fontSize === DEFAULT_FONT_SIZE" @click="fontSize = DEFAULT_FONT_SIZE">重置</button>
        <button type="button" :aria-pressed="wrap" @click="wrap = !wrap">自动换行</button>
      </div>
    </div>
    <v-ace-editor
      ref="aceRef"
      class="code-editor"
      :value="code"
      lang="c_cpp"
      theme="chrome"
      :readonly="true"
      :options="editorOptions"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Range } from 'ace-builds'
import type { Ace } from 'ace-builds'
import { VAceEditor } from 'vue3-ace-editor'
import type { VAceEditorInstance } from 'vue3-ace-editor/types'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/theme-chrome'

const props = withDefaults(defineProps<{
  code: string
  hline_start?: number
  hline_end?: number
}>(), {
  hline_start: -1,
  hline_end: -1,
})

const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 15
const STORAGE_KEY = 'dsa3-code-reader'
const fontSize = ref(DEFAULT_FONT_SIZE)
const wrap = ref(false)
// Storage may be unavailable in private browsing or restricted embeds.
try {
  const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  if (saved && typeof saved === 'object') {
    if ('fontSize' in saved && typeof saved.fontSize === 'number' && Number.isFinite(saved.fontSize)) {
      fontSize.value = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(saved.fontSize)))
    }
    if ('wrap' in saved && typeof saved.wrap === 'boolean') wrap.value = saved.wrap
  }
} catch { /* Use the default reading settings. */ }

const aceRef = ref<VAceEditorInstance | null>(null)
let markerId: number | null = null
let gutterRows: number[] = []
const editorOptions = computed<Partial<Ace.EditorOptions>>(() => ({
  showPrintMargin: false,
  highlightActiveLine: false,
  highlightGutterLine: false,
  showFoldWidgets: false,
  fontSize: fontSize.value,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  // The Vue wrapper's wrap watcher toggles editing behaviour, so set Ace's option directly.
  wrap: wrap.value,
  indentedSoftWrap: true,
  tabSize: 4,
  useWorker: false,
}))

const getEditor = (): Ace.Editor | null => aceRef.value?.getAceInstance() || null

const clearMarker = (): void => {
  const session = getEditor()?.getSession()
  if (session) {
    if (markerId !== null) session.removeMarker(markerId)
    for (const row of gutterRows) session.removeGutterDecoration(row, 'execution-gutter')
  }
  markerId = null
  gutterRows = []
}

const revealHighlight = (): void => {
  if (props.hline_start >= 0 && props.hline_end >= props.hline_start) {
    getEditor()?.scrollToLine(props.hline_start, true, false, () => undefined)
  }
}

const syncHighlight = (): void => {
  const editor = getEditor()
  if (!editor) return
  clearMarker()
  const { hline_start: start, hline_end: end } = props
  if (start < 0 || end < start) return
  const session = editor.getSession()
  const lastRow = Math.min(end, session.getLength() - 1)
  if (start > lastRow) return
  markerId = session.addMarker(new Range(start, 0, lastRow, session.getLine(lastRow).length), 'highlightLine', 'fullLine', false)
  for (let row = start; row <= lastRow; row++) {
    session.addGutterDecoration(row, 'execution-gutter')
    gutterRows.push(row)
  }
  revealHighlight()
}

onMounted(syncHighlight)
watch(() => [props.code, props.hline_start, props.hline_end], syncHighlight, { flush: 'post' })
watch([fontSize, wrap], async () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize: fontSize.value, wrap: wrap.value }))
  } catch { /* Reading controls still work without persistence. */ }
  await nextTick()
  const editor = getEditor()
  editor?.renderer.updateFontSize()
  editor?.resize(true)
  revealHighlight()
}, { flush: 'post' })
onBeforeUnmount(clearMarker)
</script>

<style scoped>
.code-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  background: #fafbfc;
  color: #243247;
}
.code-toolbar {
  display: flex;
  flex-wrap: wrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  border-bottom: 1px solid #dfe5e2;
  padding: 6px 10px;
  background: #fff;
  font-size: 13px;
}
.code-title { font-weight: 650; white-space: nowrap; }
.code-language { margin-left: 5px; color: #64748b; font-size: 12px; font-weight: 400; }
.code-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.code-tools button {
  min-width: 36px;
  min-height: 36px;
  padding: 4px 8px;
  border: 1px solid #dfe5e2;
  border-radius: 5px;
  background: #fff;
  color: #334155;
  font: inherit;
  cursor: pointer;
}
.code-tools button:hover:not(:disabled) { background: #f1f5f9; }
.code-tools button[aria-pressed="true"] { background: #edf7f4; border-color: #176b5b; color: #176b5b; }
.code-tools button:disabled { opacity: .45; cursor: default; }
.code-tools button:focus-visible { outline: 3px solid #176b5b; outline-offset: 2px; }
.font-size { min-width: 42px; text-align: center; font-variant-numeric: tabular-nums; }
.code-editor { flex: 1 1 0; width: 100%; min-height: 0; line-height: 1.6; }
.code-panel :deep(.ace_editor) { background: #fafbfc; color: #243247; }
.code-panel :deep(.ace_gutter) { background: #f1f5f9; color: #64748b; border-right: 1px solid #e2e8f0; }
.code-panel :deep(.ace_keyword),
.code-panel :deep(.ace_storage),
.code-panel :deep(.ace_support.ace_type) { color: #5154a3; }
.code-panel :deep(.ace_keyword.ace_operator) { color: #475569; }
.code-panel :deep(.ace_string) { color: #24664c; }
.code-panel :deep(.ace_constant.ace_numeric),
.code-panel :deep(.ace_constant.ace_language) { color: #925522; }
.code-panel :deep(.ace_comment) { color: #617569; font-style: normal; }
.code-panel :deep(.ace_entity.ace_name.ace_function),
.code-panel :deep(.ace_support.ace_function) { color: #245a82; }
.code-panel :deep(.ace_marker-layer .ace_selection) { background: #dbeafe; }
.code-panel :deep(.ace_cursor) { opacity: 0; }
.code-panel :deep(.highlightLine) {
  position: absolute;
  background: #e0f2e9;
  box-shadow: inset 3px 0 0 #176b5b;
}
.code-panel :deep(.execution-gutter) { background: #d1e9dd; color: #145443; font-weight: 700; }
@media (max-width: 767px) {
  .code-tools button { min-width: 44px; min-height: 44px; }
}
</style>
