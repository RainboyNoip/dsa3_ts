<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert } from 'naive-ui/es/alert'
import { NButton } from 'naive-ui/es/button'
import { NModal } from 'naive-ui/es/modal'

const MAX_LENGTH = 80

const props = defineProps<{
    show: boolean
    text: string
    pattern: string
}>()

const emit = defineEmits<{
    'update:show': [value: boolean]
    submit: [value: { text: string; pattern: string }]
}>()

const textInput = ref('')
const patternInput = ref('')

const errorMessage = computed(() => {
    if (patternInput.value.length === 0) return '模式串不能为空'
    if (textInput.value.length > MAX_LENGTH) return `主串长度不能超过 ${MAX_LENGTH} 个字符`
    if (patternInput.value.length > MAX_LENGTH) return `模式串长度不能超过 ${MAX_LENGTH} 个字符`
    return ''
})

watch(() => props.show, (show) => {
    if (!show) return
    textInput.value = props.text
    patternInput.value = props.pattern
})

const close = (): void => emit('update:show', false)

const restoreSample = (): void => {
    textInput.value = props.text
    patternInput.value = props.pattern
}

const submit = (): void => {
    if (errorMessage.value) return
    emit('submit', { text: textInput.value, pattern: patternInput.value })
    close()
}
</script>

<template>
  <n-modal
    :show="show"
    preset="card"
    title="输入字符串"
    style="width: min(42rem, calc(100vw - 2rem))"
    @update:show="emit('update:show', $event)"
  >
    <div class="kmp-input-form">
      <label class="kmp-input-field">
        <span>主串</span>
        <input
          v-model="textInput"
          type="text"
          :maxlength="MAX_LENGTH"
          autocomplete="off"
          aria-label="主串"
          placeholder="例如：ABABDABACDABABCABAB"
        />
      </label>
      <label class="kmp-input-field">
        <span>模式串</span>
        <input
          v-model="patternInput"
          type="text"
          :maxlength="MAX_LENGTH"
          autocomplete="off"
          aria-label="模式串"
          placeholder="例如：ABABCABAB"
        />
      </label>
      <p class="kmp-input-meta">最多 {{ MAX_LENGTH }} 个字符，可直接输入空格。</p>
      <n-alert v-if="errorMessage" type="error" :show-icon="true">
        {{ errorMessage }}
      </n-alert>
      <div class="kmp-input-actions">
        <n-button @click="restoreSample">恢复样例</n-button>
        <n-button @click="close">取消</n-button>
        <n-button type="primary" :disabled="Boolean(errorMessage)" @click="submit">应用字符串</n-button>
      </div>
    </div>
  </n-modal>
</template>

<style scoped>
.kmp-input-form {
  display: grid;
  gap: 14px;
}

.kmp-input-field {
  display: grid;
  gap: 6px;
  color: #18201f;
  font-size: 0.875rem;
  font-weight: 650;
}

.kmp-input-field input {
  width: 100%;
  min-height: 42px;
  border: 1px solid #cfd8d4;
  border-radius: 4px;
  padding: 0 0.75rem;
  background: #fff;
  color: #18201f;
  font: 0.95rem/1.4 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.kmp-input-field input:focus-visible {
  outline: 3px solid rgb(23 107 91 / 30%);
  outline-offset: 1px;
}

.kmp-input-meta {
  margin: 0;
  color: #68716f;
  font-size: 0.75rem;
}

.kmp-input-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
</style>
