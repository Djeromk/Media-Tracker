<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import type { Component } from "vue";

interface CategoryStats {
  total: number;
  backlog: number;
  inProgress: number;
  completed: number;
  dropped: number;
}

interface Props {
  title: string;
  icon: Component;
  stats: CategoryStats;
  variant: "books" | "movies" | "games";
}

interface Emits {
  (e: "add"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const completionRate = computed(() => {
  if (props.stats.total === 0) return 0;
  return Math.round((props.stats.completed / props.stats.total) * 100);
});

const iconWrapperClass = computed(() => {
  return `icon-wrapper-${props.variant}`;
});
const bgClass = computed(() => {
  return `${props.variant}-card`;
});

const statItems = computed(() => [
  {
    label: "В процессе",
    value: props.stats.inProgress,
    color: "text-(--status-progress-text)",
    bgColor: "bg-(--status-progress-bg)",
    highlight: true,
  },
  {
    label: "Завершено",
    value: props.stats.completed,
    color: "text-(--status-completed-text)",
    bgColor: "bg-(--status-completed-bg)",
  },
  {
    label: "Бэклог",
    value: props.stats.backlog,
    color: "text-(--status-backlog-text)",
    bgColor: "bg-(--status-backlog-bg)",
  },
]);
</script>

<template>
  <div class="category-card" :class="bgClass">
    <div class="flex items-center justify-between p-2 pb-6">
      <div class="flex items-center gap-3">
        <div :class="iconWrapperClass" class="p-3">
          <component :is="icon" :size="24" />
        </div>
        <div>
          <h4 class="text-2xl font-semibold text-(--text-primary)">
            {{ title }}
          </h4>
          <p class="text-xs text-(--text-tertiary)">
            {{ stats.total }} {{ stats.total === 1 ? "элемент" : "элементов" }}
          </p>
        </div>
      </div>

      <button
        @click="emit('add')"
        class="btn-add bg-(--primary-500) p-3 items-center gap-2"
        title="Добавить"
      >
        Добавить
        <Plus :size="16" />
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 mb-4">
      <div
        v-for="item in statItems"
        :key="item.label"
        :class="[
          'p-3 rounded-lg transition-all',
          item.highlight
            ? 'ring-1 ring-(--status-completed-border) row-span-2 content-end'
            : '',
        ]"
      >
        <div
          :class="[
            item.highlight
              ? 'text-4xl font-extrabold '
              : 'text-xl font-bold leading-none mb-1',
            item.color,
          ]"
        >
          {{ item.value }}
        </div>
        <div class="text-xs) text-(--text-tertiary)">
          {{ item.label }}
        </div>
      </div>
    </div>
    <div class="">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-(--text-tertiary)"> Завершено </span>
          <span class="text-xs font-semibold text-(--text-secondary)">
            {{ completionRate }}%
          </span>
        </div>
        <div class="progress">
          <div
            class="progress-fill"
            :style="{ width: `${completionRate}%` }"
          ></div>
        </div>
    </div>

    <!-- Быстрая информация внизу -->
    <div
      v-if="stats.dropped > 0"
      class="mt-4 pt-3 border-t border-(--border-color-subtle)"
    >
      <div class="flex items-center justify-between text-(--text-xs)">
        <span class="text-(--text-tertiary)">Брошено</span>
        <span class="font-medium text-(--status-dropped-text)">
          {{ stats.dropped }}
        </span>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-if="stats.total === 0" class="py-8 text-center">
      <component :is="icon" :size="32" class="mx-auto mb-3 text-(--gray-300)" />
      <p class="text-sm text-(--text-tertiary) mb-3">Нет элементов</p>
      <button @click="emit('add')" class="btn-secondary text-(--text-xs)">
        Добавить первый
      </button>
    </div>
  </div>
</template>
