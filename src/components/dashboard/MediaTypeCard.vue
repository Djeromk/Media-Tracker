<script setup lang="ts">
import { computed } from 'vue'
import type { MediaType, MediaStats, MediaStatus, UserMedia } from '@/types'
import { Plus, Archive, ClockFading, CircleCheckBig } from 'lucide-vue-next'
import { MEDIA_TYPE_LABELS, MEDIA_TYPE_ICONS, STATUS_LABELS } from '@/types'
import InProgress from './InProgress.vue'

interface Props {
  type: MediaType
  stats: MediaStats
  inProgressItem: UserMedia | null
  onAddClick: () => void
  onUpdateStatus: (id: string, status: MediaStatus) => void
}

const props = defineProps<Props>()

// Вычисляем процент завершения
const completionPercentage = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.completed / props.stats.total) * 100)
})
</script>

<template>
  <div class="card-neo w-full">
    <!-- Заголовок с иконкой и кнопкой добавления -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3 min-h-25">
        <span class="text-6xl">{{ MEDIA_TYPE_ICONS[type] }}</span>
        <div>
          <h3 class="text-3xl font-semibold text-gray-800 ">
            {{ MEDIA_TYPE_LABELS[type] }}
          </h3>
          <p class="text-xl text-gray-500">{{ stats.total }}</p>
        </div>
      </div>
      <button @click="onAddClick" class="btn-add hover:text-blue-500">
        <Plus />
      </button>
    </div>

    <!-- Статистика по статусам -->
    <div class="space-y-3 mb-6">
      <div class="flex items-center justify-between text-xl">
        <div class="flex items-center space-x-2">
          <span class="text-orange-500"><Archive /></span>
          <span class="">{{ STATUS_LABELS.backlog }}</span>
        </div>
        <span class="font-medium text-gray-800">{{ stats.backlog }}</span>
      </div>

      <div class="flex items-center justify-between text-xl">
        <div class="flex items-center space-x-2">
          <span class="text-blue-500"><ClockFading /></span>
          <span class="">{{ STATUS_LABELS.in_progress }}</span>
        </div>
        <span class="font-medium text-gray-800">{{ stats.inProgress }}</span>
      </div>

      <div class="flex items-center justify-between text-xl">
        <div class="flex items-center space-x-2">
          <span class="text-green-500"><CircleCheckBig /></span>
          <span class="">{{ STATUS_LABELS.completed }}</span>
        </div>
        <span class="font-medium text-gray-800">{{ stats.completed }}</span>
      </div>
    </div>



    <div v-if="completionPercentage" class="py-5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-500">Прогресс:</span>
        <span class="text-xs font-medium text-gray-700">{{ completionPercentage }}%</span>
      </div>
      <div class="progress-neo">
        <div
          class="progress-fill transition-all duration-500"
          :style="{ width: `${completionPercentage}%` }"
        />
      </div>
    </div>
    <InProgress
      v-if="inProgressItem"
      :item="inProgressItem"
      @update-status="onUpdateStatus"
    />
  </div>
</template>
