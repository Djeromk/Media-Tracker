<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import MediaTypeCard from "@/components/dashboard/MediaTypeCard.vue";
import SearchModal from "@/components/search/SearchModal.vue";
import Banner from "@/components/dashboard/Banner.vue";
import type {
  MediaType,
  MediaStatus,
  KinopoiskItem,
  ExternalBook,
  ExternalGame,
} from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>("movie");
const notification = ref<{ message: string; type: "success" | "error" } | null>(
  null,
);
onMounted(() => {
  if (authStore.user) {
    mediaStore.fetchUserMedia();
    console.log("User media:", mediaStore.userMedia);
    console.log("authStore.user:", authStore.user);
  }
});

const inProgressItems = computed(() => ({
  movie: mediaStore.getInProgressByType('movie')[0] || null,
  book: mediaStore.getInProgressByType('book')[0] || null,
  game: mediaStore.getInProgressByType('game')[0] || null
}))

function openSearchModal(type: MediaType) {
  selectedMediaType.value = type;
  isSearchModalOpen.value = true;
}

function closeSearchModal() {
  isSearchModalOpen.value = false;
}

function timeOfDay() {
  const hours = new Date().getHours();
  return hours >= 6 && hours < 18 ? "Добрый День" : "Добрый Вечер";
}

async function handleMediaSelect(
  item: KinopoiskItem | ExternalBook | ExternalGame,
  status: MediaStatus
) {
  console.log('=== Starting media add process ===')
  console.log('Item:', item)
  console.log('Type:', selectedMediaType.value)
  console.log('Status:', status)
  console.log('User authenticated:', authStore.isAuthenticated)

  if (!authStore.isAuthenticated) {
    notification.value = {
      message: 'Войдите в аккаунт, чтобы сохранять медиа в свой список',
      type: 'error'
    }
    setTimeout(() => notification.value = null, 3000)
    return
  }

  const result = await mediaStore.addMediaFromExternal(
    item,
    selectedMediaType.value,
    status // Передаем выбранный статус
  )

  console.log('=== Result ===', result)

  if (result.success) {
    notification.value = {
      message: result.message || 'Медиа успешно добавлено в ваш список!',
      type: 'success'
    }
  } else {
    notification.value = {
      message: result.error || 'Ошибка при добавлении медиа',
      type: 'error'
    }
  }

  setTimeout(() => notification.value = null, 3000)
}

async function handleStatusUpdate(id: string, status: MediaStatus) {
  console.log('=== Updating status ===')
  console.log('Item ID:', id)
  console.log('New status:', status)

  const updates = {
    status,
    is_finished: status === 'completed',
    completed_at: status === 'completed' ? new Date().toISOString() : null
  }

  const result = await mediaStore.updateMedia(id, updates)

  if (result.success) {
    notification.value = {
      message: 'Статус успешно обновлен!',
      type: 'success'
    }
  } else {
    notification.value = {
      message: result.error || 'Ошибка при обновлении статуса',
      type: 'error'
    }
  }

  setTimeout(() => notification.value = null, 3000)
}

console.log('mediaStore.userMedia ', mediaStore.userMedia)
</script>

<template>
  <div class="min-h-screen bg-(--neo-background) py-8">
    <div class="mx-auto px-4 sm:px-6 lg:px-8">
      <Transition name="slide-down">
        <div
          v-if="notification"
          :class="[
            'fixed top-20 right-4 z-50 card-neo px-6 py-4 max-w-md',
            notification.type === 'success'
              ? 'border-l-4 border-green-500'
              : 'border-l-4 border-red-500',
          ]"
        >
          <p
            :class="
              notification.type === 'success'
                ? 'text-green-700'
                : 'text-red-700'
            "
          >
            {{ notification.message }}
          </p>
        </div>
      </Transition>

      <Banner v-if="!authStore.user" />

      <h1 class="text-3xl font-bold text-gray-800 mb-8">{{ timeOfDay() + ', ' + authStore.profile?.name }}</h1>

      <!-- Grid карточек -->
      <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
        <MediaTypeCard
          type="book"
          :stats="mediaStore.stats.books"
          :in-progress-item="inProgressItems.book"
          :on-add-click="() => openSearchModal('book')"
          :on-update-status="handleStatusUpdate"
        />

        <MediaTypeCard
          type="movie"
          :stats="mediaStore.stats.movies"
          :in-progress-item="inProgressItems.movie"
          :on-add-click="() => openSearchModal('movie')"
          :on-update-status="handleStatusUpdate"
        />

        <MediaTypeCard
          type="game"
          :stats="mediaStore.stats.games"
          :in-progress-item="inProgressItems.game"
          :on-add-click="() => openSearchModal('game')"
          :on-update-status="handleStatusUpdate"
        />
      </div>
    </div>

    <!-- Search Modal -->
    <SearchModal
      :is-open="isSearchModalOpen"
      :media-type="selectedMediaType"
      @close="closeSearchModal"
      @select="handleMediaSelect"
    />
  </div>
</template>
