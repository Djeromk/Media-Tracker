<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import type { MediaStatus, UserMedia } from '@/types';
import MediaListItem from './MediaListItem.vue';

interface Props {
  title: string;
  items: UserMedia[];
  count: number;
  status: MediaStatus;
}

interface Emits {
  (e: 'update-status', id: string, status: MediaStatus): void;
  (e: 'delete-item', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const isOpen = ref(props.status === 'in_progress' || props.status === 'backlog');
function toggleAccordion() {
  isOpen.value = !isOpen.value;
}
function handleUpdateStatus(id: string, newStatus: MediaStatus) {
  emit('update-status', id, newStatus);
}

function handleDeleteItem(id: string) {
  emit('delete-item', id);
}

function getStatusColor(): string {
  const colors: Record<MediaStatus, string> = {
    backlog: 'text-orange-600',
    in_progress: 'text-blue-600',
    completed: 'text-green-600',
    dropped: 'text-red-600',
  };
  return colors[props.status] || 'text-gray-600';
}

function getStatusIndicatorColor(): string {
  const colors: Record<MediaStatus, string> = {
    backlog: 'bg-orange-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500',
    dropped: 'bg-red-500',
  };
  return colors[props.status] || 'bg-gray-500';
}
</script>

<template>
  <div class="card-neo overflow-hidden p-0">
    <button
      @click="toggleAccordion"
      class="w-full flex items-center p-5 justify-between  cursor-pointer hover:bg-(--neo-background-body) transition-colors"
    >
      <div class="flex items-center gap-4">
        <div :class="['w-1 h-8 rounded-full', getStatusIndicatorColor()]" />
        <div class="text-left">
          <h3 :class="['text-2xl font-semibold', getStatusColor()]">
            {{ title }}
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ count }} {{ count === 1 ? 'элемент' : count < 5 ? 'элемента' : 'элементов' }}
          </p>
        </div>
      </div>
      <ChevronDown
        :class="[
          'w-6 h-6 text-gray-500 transition-transform duration-300',
          isOpen ? 'rotate-180' : ''
        ]"
      />
    </button>

    <!-- Контент аккордеона -->
    <Transition
      name="accordion"
	  mode="out-in"
	  enter-active-class="animate-fadeIn"
	  leave-active-class="animate-fadeOut"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <div class="p-6 space-y-3">
          <MediaListItem
            v-for="item in items"
            :key="item.id"
            :item="item"
            :current-status="status"
            @update-status="handleUpdateStatus"
            @delete-item="handleDeleteItem"
          />
          <div
            v-if="items.length === 0"
            class="text-center py-8 text-gray-400"
          >
            Нет элементов в этом разделе
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: height 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  height: 0;
}
</style>
