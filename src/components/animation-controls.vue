<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NButtonGroup, NInputNumber, NProgress } from 'naive-ui'
import type { AnimationPlayer } from '@/animation/useAnimationPlayer'

const props = defineProps<{
    player: AnimationPlayer
}>()

const { player } = props
const {
    currentFrame,
    frameCount,
    progress,
    isAtStart,
    isAtEnd,
    isPlaying,
} = props.player

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
        <Icon icon="fluent:previous-16-regular" width="15" height="15" />
      </n-button>
      <n-button
        :disabled="isAtEnd"
        :aria-label="isPlaying ? '暂停' : '播放'"
        :title="isPlaying ? '暂停' : '播放'"
        @click="player.togglePlay"
      >
        <Icon
          :icon="isPlaying ? 'fluent:pause-16-regular' : 'fluent:play-16-regular'"
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
        <Icon icon="fluent:next-16-regular" width="15" height="15" />
      </n-button>
      <n-button
        aria-label="重新开始"
        title="重新开始"
        @click="player.restart"
      >
        <Icon icon="fluent:arrow-clockwise-16-regular" width="15" height="15" />
      </n-button>
    </n-button-group>
    <n-input-number
      v-model:value="jumpFrame"
      class="animation-controls__jump shrink-0"
      size="small"
      :min="0"
      :max="frameCount"
      :disabled="frameCount === 0"
      :show-button="false"
      :input-props="{ 'aria-label': '跳转到帧', title: '跳转到帧' }"
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
      <Icon icon="fluent:arrow-enter-16-regular" width="15" height="15" />
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

  .animation-controls__jump :deep(.n-input) {
    min-height: 44px;
  }
}
</style>
