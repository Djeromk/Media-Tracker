<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, Trash2 } from 'lucide-vue-next';
import type { MediaStatus, UserMedia } from '@/types';
import { STATUS_LABELS, MEDIA_TYPE_LABELS } from '@/types';
import fallbackImage from '@/assets/fallback.svg';

interface Props {
  item: UserMedia;
  currentStatus: MediaStatus;
}

interface Emits {
  (e: 'update-status', id: string, status: MediaStatus): void;
  (e: 'delete-item', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const isStatusDropdownOpen = ref(false);
const isDeleteModalOpen = ref(false);
const availableStatuses = computed(() => {
const statuses: MediaStatus[] = ['backlog', 'in_progress', 'completed', 'dropped'];

  return statuses
    .filter(status => status !== props.currentStatus)
    .map(status => ({
      value: status,
      label: STATUS_LABELS[status]
    }));
});

const coverUrl = computed(() => {
  return props.item.media?.coverUrl || props.item.media?.cover_url || fallbackImage;
});

const mediaTitle = computed(() => {
  return props.item.media?.title || 'Без названия';
});

const mediaTypeLabel = computed(() => {
  const type = props.item.media?.type;
  return type ? MEDIA_TYPE_LABELS[type] : 'Неизвестно';
});

const mediaType = computed(() => {
  return props.item.media?.type
})

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = fallbackImage;
}

function toggleStatusDropdown() {
  isStatusDropdownOpen.value = !isStatusDropdownOpen.value;
}

function handleStatusChange(newStatus: MediaStatus) {
  emit('update-status', props.item.id, newStatus);
  isStatusDropdownOpen.value = false;
}

function openDeleteModal() {
  isDeleteModalOpen.value = true;
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false;
}

function confirmDelete() {
  emit('delete-item', props.item.id);
  isDeleteModalOpen.value = false;
}
</script>

<template>
  <div class="relative">
    <div
      class="flex items-center gap-4 p-4 rounded-2xl bg-(--neo-background) shadow-(--neo-shadow) hover:shadow-(--neo-shadow-sm) transition-all group"
    >
      <div class="w-27 h-36 shrink-0 rounded-lg overflow-hidden bg-gray-200 shadow-md">
        <img
          :src="coverUrl"
          :alt="mediaTitle"
          class="w-full h-full object-cover"
          @error="handleImageError"
        />
      </div>
      <div class="flex-1 min-w-0">
        <router-link
                :to="`/${mediaType}s/${item.media?.external_id}`">
        <h4 class="text-2xl font-semibold text-gray-800 truncate mb-1">
          {{ mediaTitle }}
        </h4>
        </router-link>
        <p class="text-base text-gray-500">
          {{ mediaTypeLabel }}
        </p>

        <!-- Дополнительная информация -->
        <div v-if="item.rating" class="mt-2 flex items-center gap-1">
          <span class="text-yellow-500">★</span>
          <span class="text-sm font-medium text-gray-700">{{ item.rating }}/5</span>
        </div>
      </div>

      <!-- Действия -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Кнопка изменения статуса -->
        <div class="relative">
          <button
            @click="toggleStatusDropdown"
            class="px-4 py-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 border border-gray-200"
          >
            <span class="text-sm font-medium text-gray-700">
              Изменить статус
            </span>
            <ChevronDown
              :class="[
                'w-4 h-4 text-gray-500 transition-transform duration-200',
                isStatusDropdownOpen ? 'rotate-180' : ''
              ]"
            />
          </button>

          <!-- Dropdown меню статусов -->
          <Transition name="dropdown">
            <div
              v-if="isStatusDropdownOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10"
              @click.stop
            >
              <button
                v-for="status in availableStatuses"
                :key="status.value"
                @click="handleStatusChange(status.value)"
                class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <span class="text-sm text-gray-700">{{ status.label }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- Кнопка удаления -->
        <button
          @click="openDeleteModal"
          class="p-3 rounded-xl bg-white shadow-md hover:shadow-lg hover:bg-red-50 transition-all border border-gray-200 hover:border-red-300"
          title="Удалить из списка"
        >
          <Trash2 class="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
        </button>
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <Transition name="modal">
      <div
        v-if="isDeleteModalOpen"
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        @click.self="closeDeleteModal"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            Удалить из списка?
          </h3>

          <div class="flex items-start gap-4 mb-6">
            <div class="w-30 h-39 shrink-0 rounded-lg overflow-hidden bg-gray-200">
              <img
                :src="coverUrl"
                :alt="mediaTitle"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-800 mb-1">
                {{ mediaTitle }}
              </p>
              <p class="text-sm text-gray-500">
                {{ mediaTypeLabel }}
              </p>
            </div>
          </div>

          <p class="text-gray-600 mb-6">
            Этот элемент будет удален из вашего списка. Это действие нельзя отменить.
          </p>

          <div class="flex gap-3">
            <button
              @click="closeDeleteModal"
              class="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              @click="confirmDelete"
              class="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.3s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
