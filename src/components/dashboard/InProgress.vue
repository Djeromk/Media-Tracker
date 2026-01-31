<script setup lang="ts">
import { ref } from 'vue'
import type { UserMedia, MediaStatus } from '@/types'
import { ChevronDown, Archive, CheckCircle, XCircle } from 'lucide-vue-next'

interface Props {
  item: UserMedia
}

interface Emits {
  (e: 'updateStatus', id: string, status: MediaStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isDropdownOpen = ref(false)

const actions = [
  {
    status: 'backlog' as MediaStatus,
    label: 'В бэклог',
    icon: Archive,
    color: 'text-orange-600'
  },
  {
    status: 'completed' as MediaStatus,
    label: 'Завершено',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    status: 'dropped' as MediaStatus,
    label: 'Брошено',
    icon: XCircle,
    color: 'text-red-600'
  }
]

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleStatusChange(status: MediaStatus) {
  emit('updateStatus', props.item.id, status)
  isDropdownOpen.value = false
}

function getMediaTitle(): string {
  return props.item.media?.title || 'Без названия'
}

function getCoverUrl(): string | null {
  console.log('props.item.media', props.item.media)
  return props.item.media?.coverUrl || props.item.media?.cover_url ||null
}

function getMediaType(): string {
  switch (props.item.media?.type) {
    case 'movie':
      return 'смотрю'
    case 'book':
      return 'читаю'
    case 'game':
      return 'играю'
    default:
      return 'отслеживаю'
  }
}

</script>

<template>
  <div class="mb-4">
    <p class="text-xs text-gray-500 mb-2">Сейчас {{ getMediaType() }}:</p>

    <div class="relative">
      <!-- Main button -->
      <button
        @click="toggleDropdown"
        class="w-full cursor-pointer bg-(--neo-background) shadow-(--neo-shadow) hover:shadow-(--neo-shadow-sm) rounded-2xl p-3 flex items-center space-x-3 transition-all group"
      >
        <!-- Cover image -->
        <div class="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-200">
          <img
            v-if="getCoverUrl()"
            :src="getCoverUrl()!"
            :alt="getMediaTitle()"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xl">
            📄
          </div>
        </div>

        <!-- Title -->
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-medium text-gray-800 truncate">
            {{ getMediaTitle() }}
          </p>
          <p class="text-xs text-gray-500">В процессе</p>
        </div>

        <!-- Chevron -->
        <ChevronDown
          :class="[
            'shrink-0 text-gray-500 group-hover:text-(--primary-600) transition-all duration-200',
            isDropdownOpen ? 'rotate-180' : ''
          ]"
        />
      </button>

      <!-- Dropdown actions -->
      <Transition name="dropdown">
        <div
          v-if="isDropdownOpen"
          class="absolute top-full left-0 right-0 mt-2 card-neo p-0 z-10"
          @click.stop
        >
          <button
            v-for="action in actions"
            :key="action.status"
            @click="handleStatusChange(action.status)"
            class="w-full px-6 py-4 first:rounded-t-xl last:rounded-b-xl cursor-pointer text-left hover:bg-(--neo-background-body) transition-colors flex items-center space-x-3"
          >
            <component
              :is="action.icon"
              :class="['w-5 h-5', action.color]"
            />
            <span class="text-sm text-gray-700">{{ action.label }}</span>
          </button>
        </div>
      </Transition>
    </div>
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
</style>
