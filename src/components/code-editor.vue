<!-- 只读 C/C++ 代码面板，并与动画帧的代码行范围联动。 -->
<template>
  <v-ace-editor
    ref="aceRef"
    class="code-editor"
    :value="code"
    lang="c_cpp"
    theme="monokai"
    :readonly="true"
    :options="editorOptions"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Range } from 'ace-builds'
import type { Ace } from 'ace-builds'
import { VAceEditor } from 'vue3-ace-editor'
import type { VAceEditorInstance } from 'vue3-ace-editor/types'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/theme-monokai'

const props = withDefaults(defineProps<{
  code: string
  hline_start?: number
  hline_end?: number
}>(), {
  hline_start: -1,
  hline_end: -1,
})

const aceRef = ref<VAceEditorInstance | null>(null)
const markerId = ref<number | null>(null)
const editorOptions: Partial<Ace.EditorOptions> = {
  showPrintMargin: false,
  highlightActiveLine: false,
  tabSize: 4,
  useWorker: false,
}

const getEditor = (): Ace.Editor | null => aceRef.value?.getAceInstance() || null

const clearMarker = (): void => {
  const editor = getEditor()
  if (editor && markerId.value !== null) {
    editor.getSession().removeMarker(markerId.value)
  }
  markerId.value = null
}

const syncHighlight = (): void => {
  const editor = getEditor()
  if (!editor) return

  clearMarker()
  const { hline_start: start, hline_end: end } = props
  if (start < 0 || end < start) return

  const range = new Range(start, 0, end, 1)
  markerId.value = editor.getSession().addMarker(range, 'highlightLine', 'fullLine', true)
  editor.scrollToLine(start, true, true, () => undefined)
}

onMounted(() => {
  getEditor()?.setReadOnly(true)
  syncHighlight()
})

watch(
  () => [props.hline_start, props.hline_end],
  () => syncHighlight(),
)

onBeforeUnmount(() => clearMarker())
</script>

<style scoped>
.code-editor {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}

:deep(.ace_editor) {
  background: #272822;
  color: #f8f8f2;
}

:deep(.ace_gutter) {
  background: #1f201b;
  color: #75715e;
}

:deep(.ace_gutter-active-line),
:deep(.ace_active-line) {
  background: rgb(255 255 255 / 7%);
}

:deep(.highlightLine) {
  position: absolute;
  z-index: 20;
  background-color: rgb(166 226 46 / 24%);
  box-shadow: inset 3px 0 0 #a6e22e;
}
</style>
