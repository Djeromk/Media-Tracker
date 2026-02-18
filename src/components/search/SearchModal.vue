<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  MediaType,
  MediaStatus,
  ExternalBook,
  ExternalGame,
  ExternalMovie
  //KinopoiskItem,
} from "@/types";
import {
  getItemId,
  getTitle,
  getImage,
  getMetacritic,
  getReleaseDate,
  getSubtitle,
  getSearchPlaceholder,
  getAvailableStatuses,
  getStatusIcon,
  getStatusLabel,
  isCurrentStatus,
  createImageErrorHandler,
} from "./utils";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { booksService } from "@/services/api/google-books";
import { gamesService } from "@/services/api/games";
import { useMediaStore } from "@/stores/media";
import { MEDIA_TYPE_LABELS } from "@/types";
import fallbackImage from "@/assets/fallback.svg";
import {
  X,
  ChevronDown,
  Check,
  Archive,
  ClockFading,
  CircleCheckBig,
} from "lucide-vue-next";

interface Props {
  mediaType: MediaType;
}

interface Emits {
  (e: "close"): void;
  (
    e: "select",
    item: ExternalMovie | ExternalBook | ExternalGame,
    status: MediaStatus,
  ): void;
}

/**
 * Интерфейс для обогащенного результата поиска
 * Содержит оригинальный элемент + информацию о его статусе в списке пользователя
 */
interface EnrichedSearchResult {
  item: ExternalMovie | ExternalBook | ExternalGame;
  id: string;
  isAdded: boolean;
  currentStatus: MediaStatus | null;
  userMediaId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");
const mediaStore = useMediaStore();
const searchResults = ref<(ExternalMovie | ExternalBook | ExternalGame)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeDropdown = ref<string | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
/**
 * Computed свойство для обогащения результатов поиска
 * Для каждого результата добавляет информацию:
 * - isAdded: добавлен ли элемент в список пользователя
 * - currentStatus: текущий статус элемента (если добавлен)
 * - userMediaId: ID записи в user_media (нужен для обновления статуса)
 *
 * Это позволяет избежать множественных вызовов функций поиска в template
 */
const enrichedResults = computed<EnrichedSearchResult[]>(() => {
  return searchResults.value.map((item) => {
    const itemId = getItemId(item);
    const userMediaItem = mediaStore.userMedia.find(
      (userMedia) => userMedia.media?.external_id === itemId,
    );
    return {
      item,
      id: itemId,
      isAdded: !!userMediaItem,
      currentStatus: userMediaItem?.status || null,
      userMediaId: userMediaItem?.id || null,
    };
  });
});

const availableStatuses = computed(() =>
  getAvailableStatuses(props.mediaType),
);

const placeholder = computed(() => getSearchPlaceholder(props.mediaType));

function getIconComponent(iconName: string) {
  const icons: Record<
    string,
    typeof Archive | typeof ClockFading | typeof CircleCheckBig
  > = {
    Archive,
    ClockFading,
    CircleCheckBig,
  };
  return icons[iconName];
}

watch(searchQuery, (newQuery) => {
  if (searchTimeout) clearTimeout(searchTimeout);

  if (!newQuery || newQuery.length < 2) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(() => {
    performSearch(newQuery);
  }, 1000);
});

async function performSearch(query: string) {
  loading.value = true;
  error.value = null;
  try {
    let results: (ExternalMovie | ExternalBook | ExternalGame)[] = [];

    switch (props.mediaType) {
      case "book":
        results = await booksService.searchBooks(query);
        break;
      case "movie":
        results = await kinopoiskService.searchMovies(query);
        break;
      case "game":
        results = await gamesService.searchGames(query);
        break;
    }

    searchResults.value = results;
  } catch (e) {
    const err = e as Error;
    error.value = err.message || "Ошибка поиска";
  } finally {
    loading.value = false;
  }
}

/**
 * Закрывает модальное окно и очищает результаты поиска
 */
function handleClose() {
  searchQuery.value = "";
  searchResults.value = [];
  activeDropdown.value = null;
  emit("close");
}

const handleImageError = createImageErrorHandler(fallbackImage);

function toggleDropdown(itemId: string) {
  activeDropdown.value = activeDropdown.value === itemId ? null : itemId;
}

async function handleSelectWithStatus(
  result: EnrichedSearchResult,
  status: MediaStatus,
) {
  if (result.isAdded && result.currentStatus === status) {
    activeDropdown.value = null;
    return;
  }
  if (result.isAdded && result.userMediaId) {
    const updates = {
      status,
      is_finished: status === "completed",
      completed_at: status === "completed" ? new Date().toISOString() : null,
    };

    await mediaStore.updateMedia(result.userMediaId, updates);
    activeDropdown.value = null;
    return;
  }

  emit("select", result.item, status);
  activeDropdown.value = null;
  handleClose();
}


/**
 * Директива для автофокуса на input при открытии модального окна
 */
const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
  },
};
</script>

<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div
      class="fixed inset-0 bg-black/30 z-10 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <!-- Modal -->
      <div
        class="card-padded shadow-none bg-white w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col no-scrollbar"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-4xl font-bold text-gray-800">
            {{ MEDIA_TYPE_LABELS[mediaType] }}
          </h2>
          <button
            @click="handleClose"
            class="w-10 h-10 rounded-xl cursor-pointer bg-(--neo-background) shadow-(--neo-shadow) hover:shadow-neo-sm flex items-center justify-center text-gray-600 hover:text-red-500 transition-all"
          >
            <X />
          </button>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          class="input mb-6"
          autofocus
          v-focus
        />
        <div v-if="loading" class="flex justify-center py-8">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"
          ></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="text-center py-8 text-red-600">
          {{ error }}
        </div>

        <!-- Results -->
        <div
          v-else-if="enrichedResults.length > 0"
          class="overflow-y-auto no-scrollbar flex-1 space-y-3"
        >
          <div
            v-for="result in enrichedResults"
            :key="result.id"
            class="flex items-center space-x-4 p-4 rounded-2xl bg-(--neo-background) shadow-neo hover:shadow-neo-sm cursor-pointer transition-all"
          >
            <!-- Image -->
            <div
              class="w-30 h-40 shrink-0 rounded-xl overflow-hidden bg-gray-200"
            >
              <img
                v-if="getImage(result.item)"
                :src="getImage(result.item)!"
                :alt="getTitle(result.item)"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-gray-400"
              >
                📄
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 space-y-3">
              <router-link
                :to="`/${mediaType}s/${result.item.id}`">
              <h3 class="font-semibold text-2xl text-gray-800 truncate">
                {{ getTitle(result.item) }}
              </h3>
              </router-link>

              <p class="text-base text-gray-500">
                {{ getSubtitle(result.item) }}
              </p>
              <p class="text-base text-gray-500">
                {{ getReleaseDate(result.item) }}
              </p>

              <!-- Metacritic для игр -->
              <div
                v-if="
                  mediaType === 'game' &&
                  'metacritic' in result.item &&
                  result.item.metacritic
                "
                class="text-sm w-10 h-10 flex items-center justify-center rounded-md"
                :class="{
                  'bg-green-500': result.item.metacritic >= 75,
                  'bg-yellow-500':
                    result.item.metacritic <= 74 &&
                    result.item.metacritic >= 50,
                  'bg-red-500': result.item.metacritic <= 50,
                  hidden: result.item.metacritic === 0,
                }"
              >
                <span class="font-bold">
                  {{ getMetacritic(result.item) }}
                </span>
              </div>
              <div v-if="mediaType === 'movie'" class="text-sm text-gray-500">
                <span v-if="'ratingKinopoisk' in result.item">
                  Кинопоиск:
                  <span class="font-semibold text-base">
                    {{ result.item.ratingKinopoisk }}
                  </span>
                </span>
                <span v-if="'ratingImdb' in result.item" class="ml-3">
                  IMDB:
                  <span class="font-semibold text-base">
                    {{ result.item.ratingImdb }}
                  </span>
                </span>
              </div>
              <div v-if="mediaType === 'book' && 'pageCount' in result.item">
                {{ result.item.pageCount }} стр.
              </div>
            </div>

            <!-- Action Button & Dropdown -->
            <div class="relative shrink-0">
              <button
                v-if="result.isAdded"
                @click="toggleDropdown(result.id)"
                class="btn-add group bg-green-50 border-2 border-green-500"
              >
                <span class="text-lg flex items-center gap-2">
                  <component
                    :is="getIconComponent(getStatusIcon(result.currentStatus))"
                    :size="20"
                  />
                  {{ getStatusLabel(mediaType, result.currentStatus) }}
                </span>
                <ChevronDown
                  :class="[
                    'transition-transform duration-200',
                    activeDropdown === result.id ? 'rotate-180' : '',
                  ]"
                />
              </button>
              <button
                v-else
                @click="toggleDropdown(result.id)"
                class="btn-add group"
              >
                <span class="text-lg">Добавить в </span>
                <ChevronDown
                  :class="[
                    'transition-transform duration-200',
                    activeDropdown === result.id ? 'rotate-180' : '',
                  ]"
                />
              </button>
              <Transition name="dropdown">
                <div
                  v-if="activeDropdown === result.id"
                  class="absolute right-0 top-full mt-2 w-48 p-0 z-20"
                  @click.stop
                >
                  <button
                    v-for="status in availableStatuses"
                    :key="status.value"
                    @click="handleSelectWithStatus(result, status.value)"
                    :disabled="isCurrentStatus(result, status.value)"
                    class="w-full bg-(--neo-background) cursor-pointer px-4 py-4 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-(--neo-background-body) transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="{
                      'bg-green-100': isCurrentStatus(result, status.value),
                    }"
                  >
                    <span class="text-lg text-gray-700">{{
                      status.label
                    }}</span>
                    <span
                      v-if="isCurrentStatus(result, status.value)"
                      class="ml-auto text-green-600"
                    >
                      <Check />
                    </span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <div
          v-else-if="searchQuery.length >= 2"
          class="text-center py-8 text-gray-500"
        >
          Ничего не найдено
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          Введите название для поиска
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
