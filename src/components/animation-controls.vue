<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NButton } from 'naive-ui/es/button'
import { NButtonGroup } from 'naive-ui/es/button-group'
import { NProgress } from 'naive-ui/es/progress'
import type { AnimationPlayer } from '@/animation/useAnimationPlayer'
import { animationIcons } from '@/components/animation-icons'
import LocalIcon from '@/components/local-icon.vue'

const props = defineProps<{
    player: AnimationPlayer
}>()

// Resolve the current player when a page switches between algorithm variants.
const player = computed(() => props.player)
const currentFrame = computed(() => props.player.currentFrame.value)
const frameCount = computed(() => props.player.frameCount.value)
const progress = computed(() => props.player.progress.value)
const isAtStart = computed(() => props.player.isAtStart.value)
const isAtEnd = computed(() => props.player.isAtEnd.value)
const isPlaying = computed(() => props.player.isPlaying.value)
const playIcon = computed(() => isPlaying.value ? animationIcons.pause : animationIcons.play)

const jumpFrame = ref<number | null>(currentFrame.value)

watch(currentFrame, (frame) => {
    jumpFrame.value = frame
})

const jump = (): void => {
    if (jumpFrame.value !== null) props.player.setFrame(jumpFrame.value)
}

const handleKeydown = (event: KeyboardEvent): void => {
    const target = event.target
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return

    if (event.key === 'ArrowLeft') {
        event.preventDefault()
        props.player.previousFrame()
    } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        props.player.nextFrame()
    } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault()
        props.player.togglePlay()
    } else if (event.key === 'Home') {
        event.preventDefault()
        props.player.restart()
    }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="animation-controls flex w-full min-w-0 items-center justify-center gap-2">
    <n-button-group class="animation-controls__group shrink-0">
      <n-button
        :disabled="isAtStart"
        aria-label="上一帧"
        title="上一帧"
        @click="player.previousFrame"
      >
        <LocalIcon :icon="animationIcons.previous" width="15" height="15" />
      </n-button>
      <n-button
        :disabled="isAtEnd"
        :aria-label="isPlaying ? '暂停' : '播放'"
        :title="isPlaying ? '暂停' : '播放'"
        @click="player.togglePlay"
      >
        <LocalIcon
          :icon="playIcon"
          width="15"
          height="15"
        />
      </n-button>
      <n-button
        :disabled="isAtEnd"
        aria-label="下一帧"
        title="下一帧"
        @click="player.nextFrame"
      >
        <LocalIcon :icon="animationIcons.next" width="15" height="15" />
      </n-button>
      <n-button
        aria-label="重新开始"
        title="重新开始"
        @click="player.restart"
      >
        <LocalIcon :icon="animationIcons.clockwise" width="15" height="15" />
      </n-button>
    </n-button-group>
    <input
      v-model.number="jumpFrame"
      class="animation-controls__jump shrink-0"
      type="number"
      :min="0"
      :max="frameCount"
      :disabled="frameCount === 0"
      aria-label="跳转到帧"
      title="跳转到帧"
      @keydown.enter="jump"
    />
    <n-button
      quaternary
      circle
      :disabled="frameCount === 0"
      aria-label="确认跳转"
      title="确认跳转"
      @click="jump"
    >
      <LocalIcon :icon="animationIcons.enter" width="15" height="15" />
    </n-button>
    <n-progress
      class="animation-controls__progress min-w-0 flex-1"
      type="line"
      :percentage="progress"
    >
      {{ currentFrame }}/{{ frameCount }}
    </n-progress>
  </div>
</template>

<style scoped>
.animation-controls {
  flex-wrap: wrap;
}

.animation-controls__jump {
  width: 4.5rem;
  min-height: 30px;
  border: 1px solid #cfd8d4;
  border-radius: 4px;
  padding: 0 0.5rem;
  background: #fff;
  color: #18201f;
  font: inherit;
  text-align: center;
}

.animation-controls__jump:focus-visible {
  outline: 3px solid rgb(23 107 91 / 30%);
  outline-offset: 1px;
}

.animation-controls__progress {
  max-width: 28rem;
}

@media (max-width: 767px) {
  .animation-controls {
    justify-content: flex-start;
  }

  .animation-controls__jump {
    width: 3.5rem !important;
  }

  .animation-controls__progress {
    flex-basis: 100%;
    max-width: none;
    order: 3;
  }

  .animation-controls :deep(.n-button) {
    min-width: 44px;
    min-height: 44px;
  }

  .animation-controls__jump {
    min-height: 44px;
  }
}
</style>
