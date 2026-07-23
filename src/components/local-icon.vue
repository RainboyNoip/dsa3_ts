<script setup lang="ts">
import { computed } from 'vue'
import type { LocalIconDefinition } from './local-icon'

const props = defineProps<{
    icon: LocalIconDefinition
    width?: number | string
    height?: number | string
}>()

const iconWidth = computed(() => props.icon.width || 24)
const iconHeight = computed(() => props.icon.height || 24)
const renderedWidth = computed(() => props.width || iconWidth.value)
const renderedHeight = computed(() => props.height || iconHeight.value)
const viewBox = computed(() => `0 0 ${iconWidth.value} ${iconHeight.value}`)
</script>

<template>
  <svg
    class="local-icon"
    xmlns="http://www.w3.org/2000/svg"
    :width="renderedWidth"
    :height="renderedHeight"
    :viewBox="viewBox"
    aria-hidden="true"
    focusable="false"
    v-html="icon.body"
  ></svg>
</template>

<style scoped>
.local-icon {
  display: block;
  flex: none;
  overflow: visible;
}
</style>
