<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MediaType, MediaStatus, UserMedia } from '@/types';
import { MEDIA_TYPE_LABELS } from '@/types';
import AccordionSection from './AccordionSection.vue';

interface Props {
  userMedia: UserMedia[];
}

interface Emits {
  (e: 'update-status', id: string, status: MediaStatus): void;
  (e: 'delete-item', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const selectedFilter = ref<MediaType | 'all'>('all');

const filters = [
  { value: 'all' as const, label: 'Все' },
  { value: 'movie' as const, label: MEDIA_TYPE_LABELS.movie },
  { value: 'book' as const, label: MEDIA_TYPE_LABELS.book },
  { value: 'game' as const, label: MEDIA_TYPE_LABELS.game },
];

const filteredMedia = computed(() => {
  if (selectedFilter.value === 'all') {
    return props.userMedia;
  }
  return props.userMedia.filter(item => item.media?.type === selectedFilter.value);
});

const groupedByStatus = computed(() => {
  const groups: Record<MediaStatus, UserMedia[]> = {
    backlog: [],
    in_progress: [],
    completed: [],
    dropped: [],
  };

  filteredMedia.value.forEach(item => {
    if (item.status && groups[item.status]) {
      groups[item.status].push(item);
    }
  });

  return groups;
});

function handleFilterChange(filter: MediaType | 'all') {
  selectedFilter.value = filter;
}

function handleUpdateStatus(id: string, status: MediaStatus) {
  emit('update-status', id, status);
}

function handleDeleteItem(id: string) {
  emit('delete-item', id);
}
</script>

<template>
  <div class="w-full space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-3xl font-bold text-gray-800">
        Мои списки
      </h2>

      <!-- Счетчик элементов -->
      <div class="text-lg text-gray-500">
        Всего: {{ filteredMedia.length }} элементов
      </div>
    </div>

    <div class="flex gap-3 flex-wrap w-fit bg-gray-400 p-3 rounded-2xl">
      <button
        v-for="filter in filters"
        :key="filter.value"
        @click="handleFilterChange(filter.value)"
        :class="[
          'px-6 py-3 rounded-2xl font-medium transition-all duration-200 cursor-pointer',
          selectedFilter === filter.value
            ? 'bg-(--neo-background-body) text-gray-900 shadow-lg'
            : ' bg-gray-400 text-gray-900 hover:bg-(--neo-background)'
        ]"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="flex flex-col gap-6">
      <AccordionSection
        title="Бэклог"
        :items="groupedByStatus.backlog"
        :count="groupedByStatus.backlog.length"
        status="backlog"
        @update-status="handleUpdateStatus"
        @delete-item="handleDeleteItem"
      />

      <AccordionSection
        title="В процессе"
        :items="groupedByStatus.in_progress"
        :count="groupedByStatus.in_progress.length"
        status="in_progress"
        @update-status="handleUpdateStatus"
        @delete-item="handleDeleteItem"
      />

      <AccordionSection
        title="Завершенные"
        :items="groupedByStatus.completed"
        :count="groupedByStatus.completed.length"
        status="completed"
        @update-status="handleUpdateStatus"
        @delete-item="handleDeleteItem"
      />

      <AccordionSection
        title="Брошенные"
        :items="groupedByStatus.dropped"
        :count="groupedByStatus.dropped.length"
        status="dropped"
        @update-status="handleUpdateStatus"
        @delete-item="handleDeleteItem"
      />
    </div>

    <div
      v-if="filteredMedia.length === 0"
      class="card-neo text-center py-12"
    >
      <p class="text-gray-500 text-lg">
        {{ selectedFilter === 'all'
          ? 'Ваш список пуст. Начните добавлять медиа!'
          : `Нет элементов в категории "${filters.find(f => f.value === selectedFilter)?.label}"`
        }}
      </p>
    </div>
  </div>
</template>
