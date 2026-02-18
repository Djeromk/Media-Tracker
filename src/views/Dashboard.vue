<script setup lang="ts">
import InProgressHero from "@/components/dashboard/InProgressHero.vue";
import ActivityCard2 from "@/components/dashboard/ActivityCard2.vue";
import MediaTypeCard2 from "@/components/dashboard/MediaTypeCard2.vue";
import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import { ref, onMounted, computed } from "vue";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import SearchModal from "@/components/search/SearchModal.vue";
import Banner from "@/components/dashboard/Banner.vue";
import MediaAccordion from "@/components/accordion/MediaAccordion.vue";
import type {
  MediaType,
  MediaStatus,
  UserMedia,
  ExternalMovie,
  ExternalBook,
  ExternalGame,
} from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>("other");
const notification = ref<{ message: string; type: "success" | "error" } | null>(
  null
);
onMounted(() => {
  if (authStore.user) {
    mediaStore.fetchUserMedia();
    console.log("User media:", mediaStore.userMedia);
    console.log("authStore.user:", authStore.user);
  }
});

const inProgressItems = computed(() => {
  return mediaStore.userMedia.filter(item => item.status === 'in_progress')
});

const stats = computed(() => mediaStore.stats);

// const totalStats = computed(() => {
//   const total =
//     stats.value.books.total +
//     stats.value.movies.total +
//     stats.value.games.total;
//   const completed =
//     stats.value.books.completed +
//     stats.value.movies.completed +
//     stats.value.games.completed;
//   const inProgress =
//     stats.value.books.inProgress +
//     stats.value.movies.inProgress +
//     stats.value.games.inProgress;

//   return {
//     total,
//     completed,
//     inProgress,
//     thisWeekCompleted: 3, // Моковое значение - завершено на этой неделе
//   };
// });
// const getCategoryProgress = (category: "books" | "movies" | "games") => {
//   const data = stats.value[category];
//   if (data.total === 0) return 0;
//   return Math.round((data.completed / data.total) * 100);
// };

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
  item: ExternalMovie | ExternalBook | ExternalGame,
  status: MediaStatus
) {
  console.log("=== Starting media add process ===");
  console.log("Item:", item);
  console.log("Type:", selectedMediaType.value);
  console.log("Status:", status);
  console.log("User authenticated:", authStore.isAuthenticated);

  if (!authStore.isAuthenticated) {
    notification.value = {
      message: "Войдите в аккаунт, чтобы сохранять медиа в свой список",
      type: "error",
    };
    setTimeout(() => (notification.value = null), 3000);
    return;
  }

  if (status) {
  }

  const result = await mediaStore.addMediaFromExternal(
    item,
    selectedMediaType.value,
    status
  );

  console.log("=== Result ===", result);

  if (result.success) {
    notification.value = {
      message: result.message || "Медиа успешно добавлено в ваш список!",
      type: "success",
    };
  } else {
    notification.value = {
      message: result.error || "Ошибка при добавлении медиа",
      type: "error",
    };
  }

  setTimeout(() => (notification.value = null), 3000);
}

async function handleStatusUpdate(id: string, status: MediaStatus) {
  console.log("=== Updating status ===");
  console.log("Item ID:", id);
  console.log("New status:", status);

  const updates = {
    status,
    is_finished: status === "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const result = await mediaStore.updateMedia(id, updates);

  if (result.success) {
    notification.value = {
      message: "Статус успешно обновлен!",
      type: "success",
    };
  } else {
    notification.value = {
      message: result.error || "Ошибка при обновлении статуса",
      type: "error",
    };
  }

  setTimeout(() => (notification.value = null), 3000);
}

async function handleDeleteItem(id: string) {
  const result = await mediaStore.deleteMedia(id);

  if (result.success) {
    showNotification("Элемент удален из списка", "success");
  } else {
    showNotification(result.error || "Ошибка при удалении элемента", "error");
  }
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}

const activityStats = computed(() => ({
  booksStats: {
    completed: stats.value.books.completed,
    total: stats.value.books.total,
  },
  moviesStats: {
    completed: stats.value.movies.completed,
    total: stats.value.movies.total,
  },
  gamesStats: {
    completed: stats.value.games.completed,
    total: stats.value.games.total,
  },
  thisWeekCompleted: 4, // Моковое значение
}));

function handleUpdateStatus(id: string, status: MediaStatus) {
  console.log("Update status:", id, status);
  // TODO: Обновить статус через store
}

function handleViewAllInProgress() {
  console.log("View all in progress");
  // TODO: Навигация на страницу со всеми элементами в процессе
}
</script>

<template>
  <div class="min-h-screen bg-(--background-body)">
    <!-- Контейнер с максимальной шириной -->
    <div class="container-xl px-6 py-8">
      <!-- Хедер -->
      <header class="mb-10">
        <div class="flex items-center justify-between">
          <Banner v-if="!authStore.user" />
          <!-- Приветствие -->
          <div>
            <h1 class="mb-2">Media Tracker</h1>
            <p class="text-base) text-(--text-tertiary)">
              Добрый вечер, Алиса 👋
            </p>
          </div>

          <!-- Навигация -->
          <nav class="flex items-center gap-2">
            <button class="nav-link-active">Главная</button>
            <button class="nav-link">Мои списки</button>
            <button class="nav-link">Статистика</button>
            <button class="nav-link">Выйти</button>
          </nav>
        </div>
      </header>

      <!-- HERO БЛОК: InProgress -->
      <InProgressHero
        :items="inProgressItems"
        @update-status="handleUpdateStatus"
        @view-all="handleViewAllInProgress"
      />

      <div class="mb-6">
        <h2 class="mb-2">Статистика</h2>
        <p class="text-sm text-(--text-tertiary)">
          Отслеживайте свой прогресс по всем категориям
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        <ActivityCard2
          :books-stats="activityStats.booksStats"
          :movies-stats="activityStats.moviesStats"
          :games-stats="activityStats.gamesStats"
          :this-week-completed="activityStats.thisWeekCompleted"
        />

        <MediaTypeCard2
          title="Книги"
          :icon="BookOpen"
          :stats="stats.books"
          variant="books"
          @add="() => openSearchModal('book')"
        />
        <MediaTypeCard2
          title="Фильмы и Сериалы"
          :icon="Film"
          :stats="stats.movies"
          variant="movies"
          @add="() => openSearchModal('movie')"
        />

        <MediaTypeCard2
          title="Игры"
          :icon="Gamepad2"
          :stats="stats.games"
          variant="games"
          @add="() => openSearchModal('game')"
        />
      </div>
        <MediaAccordion
          class="pt-8"
          v-if="authStore.user && mediaStore.userMedia.length > 0"
          :user-media="mediaStore.userMedia"
          @update-status="handleStatusUpdate"
          @delete-item="handleDeleteItem"
        />

      <SearchModal
        v-if="isSearchModalOpen"
        :media-type="selectedMediaType"
        @close="closeSearchModal"
        @select="handleMediaSelect"
      />
    </div>

    <!-- Дополнительные секции (опционально) -->
    <div class="mt-16">
      <div class="flex items-center justify-between mb-6">
        <h2>Недавно добавленные</h2>
        <button class="btn-ghost">Смотреть все →</button>
      </div>

      <!-- Placeholder -->
      <div class="card-padded text-center py-12">
        <p class="text-sm">Нет недавно добавленных элементов</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/**
 * Анимация появления карточек с задержкой
 */
.grid > * {
  animation: slideIn var(--transition-slower) ease-out;
}

.grid > *:nth-child(1) {
  animation-delay: 0ms;
}

.grid > *:nth-child(2) {
  animation-delay: 100ms;
}

.grid > *:nth-child(3) {
  animation-delay: 150ms;
}

.grid > *:nth-child(4) {
  animation-delay: 200ms;
}
</style>
<!-- <script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useMediaStore } from "@/stores/media";
import { useAuthStore } from "@/stores/auth";
import MediaTypeCard2 from "@/components/dashboard/MediaTypeCard2.vue";
//import ActivityCard from "@/components/dashboard/ActivityCard.vue";
import ActivityCard2 from "@/components/dashboard/ActivityCard2.vue";
import SearchModal from "@/components/search/SearchModal.vue";
import Banner from "@/components/dashboard/Banner.vue";
import MediaAccordion from "@/components/accordion/MediaAccordion.vue";
import type {
  MediaType,
  MediaStatus,
  //UserMedia,
 // KinopoiskItem,
  ExternalMovie,
  ExternalBook,
  ExternalGame,
} from "@/types";

const mediaStore = useMediaStore();
const authStore = useAuthStore();

const isSearchModalOpen = ref(false);
const selectedMediaType = ref<MediaType>('other');
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
  movie: mediaStore.getInProgressByType("movie")[0] || null,
  book: mediaStore.getInProgressByType("book")[0] || null,
  game: mediaStore.getInProgressByType("game")[0] || null,
}));

/**
 * Моковые данные для демонстрации
 * В реальном приложении это будет приходить из Pinia store
 */
 const stats = ref({
  books: {
    total: 12,
    backlog: 5,
    inProgress: 3,
    completed: 4
  },
  movies: {
    total: 8,
    backlog: 2,
    inProgress: 1,
    completed: 5
  },
  games: {
    total: 6,
    backlog: 3,
    inProgress: 2,
    completed: 1
  }
})

// Элементы в процессе для Hero блока
const inProgressHeroItems = ref([
  {
    id: '1',
    userId: 'user1',
    mediaId: 'm1',
    status: 'in_progress',
    rating: null,
    review: null,
    isFinished: false,
    startedAt: null,
    completedAt: null,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    media: {
      id: 'm1',
      type: 'movie',
      title: 'Во все тяжкие',
      coverUrl: 'https://image.tmdb.org/t/p/w200/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      external_id: null,
      isCustom: false,
      createdBy: null,
      createdAt: '2024-01-01',
      releaseYear: 2008,
      isSeries: true,
      seasonsCount: 5,
      episodesCount: 62
    }
  },
  {
    id: '2',
    userId: 'user1',
    mediaId: 'm2',
    status: 'in_progress',
    rating: null,
    review: null,
    isFinished: false,
    startedAt: null,
    completedAt: null,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
    media: {
      id: 'm2',
      type: 'book',
      title: 'Мастер и Маргарита',
      coverUrl: null,
      externalId: null,
      isCustom: false,
      createdBy: null,
      createdAt: '2024-01-01',
      author: 'Булгаков М.А.',
      pages: 480,
      isbn: null
    }
  }
])

// Статистика по категориям
const statsHero = ref({
  books: {
    total: 15,
    backlog: 6,
    inProgress: 3,
    completed: 5,
    dropped: 1
  },
  movies: {
    total: 12,
    backlog: 3,
    inProgress: 2,
    completed: 7,
    dropped: 0
  },
  games: {
    total: 8,
    backlog: 4,
    inProgress: 1,
    completed: 2,
    dropped: 1
  }
})

/**
 * Вычисляем общую статистику для карточки активности
 */
// const totalStats = computed(() => {
//   const total = stats.value.books.total + stats.value.movies.total + stats.value.games.total
//   const completed = stats.value.books.completed + stats.value.movies.completed + stats.value.games.completed
//   const inProgress = stats.value.books.inProgress + stats.value.movies.inProgress + stats.value.games.inProgress

//   return {
//     total,
//     completed,
//     inProgress,
//     thisWeekCompleted: 3 // Моковое значение - завершено на этой неделе
//   }
// })
const totalStats = computed(() => {
  const total = stats.value.books.total + stats.value.movies.total + stats.value.games.total
  const completed = stats.value.books.completed + stats.value.movies.completed + stats.value.games.completed
  const inProgress = stats.value.books.inProgress + stats.value.movies.inProgress + stats.value.games.inProgress
  const backlog = stats.value.books.backlog + stats.value.movies.backlog + stats.value.games.backlog
  //const dropped = stats.value.books.dropped + stats.value.movies.dropped + stats.value.games.dropped

  return {
    total,
    completed,
    inProgress,
    backlog,
   // dropped,
    thisWeekCompleted: 3 // Моковое значение - завершено на этой неделе
  }
})
/**
 * Функция для вычисления процента завершения категории
 */
//  const getCategoryProgress = (category: 'books' | 'movies' | 'games') => {
//   const data = stats.value[category]
//   if (data.total === 0) return 0
//   return Math.round((data.completed / data.total) * 100)
// }

const getCategoryProgress = (category: 'books' | 'movies' | 'games') => {
  const data = stats.value[category]
  if (data.total === 0) return 0
  return Math.round((data.completed / data.total) * 100)
}

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
  item: ExternalMovie | ExternalBook | ExternalGame,
  status: MediaStatus,
) {
  console.log("=== Starting media add process ===");
  console.log("Item:", item);
  console.log("Type:", selectedMediaType.value);
  console.log("Status:", status);
  console.log("User authenticated:", authStore.isAuthenticated);

  if (!authStore.isAuthenticated) {
    notification.value = {
      message: "Войдите в аккаунт, чтобы сохранять медиа в свой список",
      type: "error",
    };
    setTimeout(() => (notification.value = null), 3000);
    return;
  }

  if (status) {
  }

  const result = await mediaStore.addMediaFromExternal(
    item,
    selectedMediaType.value,
    status,
  );

  console.log("=== Result ===", result);

  if (result.success) {
    notification.value = {
      message: result.message || "Медиа успешно добавлено в ваш список!",
      type: "success",
    };
  } else {
    notification.value = {
      message: result.error || "Ошибка при добавлении медиа",
      type: "error",
    };
  }

  setTimeout(() => (notification.value = null), 3000);
}

async function handleStatusUpdate(id: string, status: MediaStatus) {
  console.log("=== Updating status ===");
  console.log("Item ID:", id);
  console.log("New status:", status);

  const updates = {
    status,
    is_finished: status === "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  const result = await mediaStore.updateMedia(id, updates);

  if (result.success) {
    notification.value = {
      message: "Статус успешно обновлен!",
      type: "success",
    };
  } else {
    notification.value = {
      message: result.error || "Ошибка при обновлении статуса",
      type: "error",
    };
  }

  setTimeout(() => (notification.value = null), 3000);
}


async function handleDeleteItem(id: string) {
  const result = await mediaStore.deleteMedia(id);

  if (result.success) {
    showNotification("Элемент удален из списка", "success");
  } else {
    showNotification(result.error || "Ошибка при удалении элемента", "error");
  }
}

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => (notification.value = null), 3000);
}
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
      <h1 class="text-3xl font-bold text-gray-800 mb-8">
        {{ timeOfDay() + ", " + authStore.profile?.name }}
      </h1>
      <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">

          <ActivityCard2
            :total-items="totalStats.total"
            :completed-items="totalStats.completed"
            :in-progress-items="totalStats.inProgress"
            :backlog-items="totalStats.backlog"
            :this-week-completed="totalStats.thisWeekCompleted"
          />

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
      <MediaAccordion
      class="pt-8"
        v-if="authStore.user && mediaStore.userMedia.length > 0"
        :user-media="mediaStore.userMedia"
        @update-status="handleStatusUpdate"
        @delete-item="handleDeleteItem"
      />
    </div>

    <SearchModal
      v-if="isSearchModalOpen"
      :media-type="selectedMediaType"
      @close="closeSearchModal"
      @select="handleMediaSelect"
    />
  </div>
</template> -->
