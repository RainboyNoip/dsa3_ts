<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { NButton, NButtonGroup, NProgress } from 'naive-ui'
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
</script>

<template>
  <div class="flex w-full min-w-0 items-center justify-center gap-2">
    <n-button-group class="shrink-0">
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
        <Icon icon="fluent:arrow-reset-16-regular" width="15" height="15" />
      </n-button>
    </n-button-group>
    <n-progress
      class="min-w-0 flex-1"
      style="max-width: 28rem"
      type="line"
      :percentage="progress"
    >
      {{ currentFrame }}/{{ frameCount }}
    </n-progress>
  </div>
</template>
