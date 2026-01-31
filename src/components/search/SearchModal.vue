<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  MediaType,
  MediaStatus,
  ExternalBook,
  ExternalGame,
  KinopoiskItem,
} from "@/types";
import {
  getItemId,
  alreadyAdded,
  getExistingStatus,
  getTitle,
  getImage,
  getMetacritic,
  getReleaseDate,
  getSubtitle,
} from "./utils";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { booksService } from "@/services/api/google-books";
import { gamesService } from "@/services/api/games";
import { useMediaStore } from "@/stores/media";
import { MEDIA_TYPE_LABELS, STATUS_LABELS } from "@/types";
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
  isOpen: boolean;
  mediaType: MediaType;
}

interface Emits {
  (e: "close"): void;
  (
    e: "select",
    item: KinopoiskItem | ExternalBook | ExternalGame,
    status: MediaStatus,
  ): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");
const mediaStore = useMediaStore();
const searchResults = ref<(KinopoiskItem | ExternalBook | ExternalGame)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const activeDropdown = ref<string | null>(null);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const placeholder = computed(() => {
  const labels = {
    movie: "Поиск фильмов...",
    shows: "Поиск сериалов...",
    book: "Поиск книг...",
    game: "Поиск игр...",
  };
  return labels[props.mediaType];
});

const availableStatuses: { value: MediaStatus; label: string; icon: string }[] =
  [
    { value: "backlog", label: STATUS_LABELS.backlog, icon: "Archive" },
    { value: "in_progress", label: STATUS_LABELS.in_progress, icon: "Clock" },
    {
      value: "completed",
      label: STATUS_LABELS.completed,
      icon: "CircleCheckBig",
    },
  ];

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

console.log("mediaStore in SearchModal: ", mediaStore.userMedia);

async function performSearch(query: string) {
  loading.value = true;
  error.value = null;

  try {
    let results: (KinopoiskItem | ExternalBook | ExternalGame)[] = [];

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
    console.log("searchResults", searchResults.value);
  } catch (e) {
    const err = e as Error;
    error.value = err.message || "Ошибка поиска";
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  searchQuery.value = "";
  searchResults.value = [];
  emit("close");
}

console.log("searchResults.value: ", searchResults.value);

const handleImageError = (event: Event) => {
  if (event.target as HTMLImageElement) {
    (event.target as HTMLImageElement).src = fallbackImage;
  }
};

function toggleDropdown(itemId: string) {
  activeDropdown.value = activeDropdown.value === itemId ? null : itemId;
}

function handleSelectWithStatus(
  item: KinopoiskItem | ExternalBook | ExternalGame,
  status: MediaStatus,
) {
  emit("select", item, status);
  activeDropdown.value = null;
  handleClose();
}

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
      v-if="isOpen"
      class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      @click.self="handleClose"
    >
      <!-- Modal -->
      <div
        class="card-neo shadow-none bg-white w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col no-scrollbar"
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

        <!-- Search Input -->
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          class="input-neo mb-6"
          autofocus
          v-focus
        />

        <!-- Loading -->
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
          v-else-if="searchResults.length > 0"
          class="overflow-y-auto no-scrollbar flex-1 space-y-3"
        >
          <div
            v-for="item in searchResults"
            :key="'id' in item ? item.id : Math.random()"
            class="flex items-center space-x-4 p-4 rounded-2xl bg-(--neo-background) shadow-neo hover:shadow-neo-sm cursor-pointer transition-all"
          >
            <!-- Image -->
            <div
              class="w-30 h-40 shrink-0 rounded-xl overflow-hidden bg-gray-200"
            >
              <img
                v-if="getImage(item)"
                :src="getImage(item)!"
                :alt="getTitle(item)"
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
              <h3 class="font-semibold text-2xl text-gray-800 truncate">
                {{ getTitle(item) }}
              </h3>
              <p class="text-base text-gray-500">
                {{ getSubtitle(item) }}
              </p>
              <p class="text-base text-gray-500">
                {{ getReleaseDate(item) }}
              </p>
              <div
                v-if="
                  props.mediaType === 'game' &&
                  'metacritic' in item &&
                  item.metacritic
                "
                class="text-sm w-10 h-10 flex items-center justify-center rounded-md"
                :class="{
                  'bg-green-500': item.metacritic >= 75,
                  'bg-yellow-500':
                    item.metacritic <= 74 && item.metacritic >= 50,
                  'bg-red-500': item.metacritic <= 50,
                  hidden: item.metacritic === 0,
                }"
              >
                <span class="font-bold">
                  {{ getMetacritic(item) }}
                </span>
              </div>
              <div
                v-if="props.mediaType === 'movie'"
                class="text-sm text-gray-500"
              >
                <span v-if="'ratingKinopoisk' in item">
                  Кинопоиск:
                  <span class="font-semibold text-base">
                    {{ item.ratingKinopoisk }}
                  </span>
                </span>
                <span v-if="'ratingImdb' in item">
                  IMDB:
                  <span class="font-semibold text-base">
                    {{ item.ratingImdb }}
                  </span>
                </span>
              </div>
            </div>
            <div class="relative shrink-0">
              <button
                v-if="alreadyAdded(item)"
                @click="toggleDropdown(getItemId(item))"
                class="btn-add group bg-green-50 border-2 border-green-500"
              >
                <span class="text-lg flex items-center gap-2">
                  <component
                    :is="
                      getIconComponent(
                        availableStatuses.find(
                          (s) => s.value === getExistingStatus(item),
                        )?.icon || 'Archive',
                      )
                    "
                    :size="20"
                  />
                  {{
                    availableStatuses.find(
                      (s) => s.value === getExistingStatus(item),
                    )?.label
                  }}
                </span>
                <ChevronDown
                  :class="[
                    'transition-transform duration-200',
                    activeDropdown === getItemId(item) ? 'rotate-180' : '',
                  ]"
                />
              </button>

              <!-- Кнопка для новых элементов -->
              <button
                v-else
                @click="toggleDropdown(getItemId(item))"
                class="btn-add group"
              >
                <span class="text-lg">Добавить в </span>
                <ChevronDown
                  :class="[
                    'transition-transform duration-200',
                    activeDropdown === getItemId(item) ? 'rotate-180' : '',
                  ]"
                />
              </button>

              <Transition name="dropdown">
                <div
                  v-if="activeDropdown === getItemId(item)"
                  class="absolute right-0 top-full mt-2 w-48 p-0 z-20"
                  @click.stop
                >
                  <button
                    v-for="status in availableStatuses"
                    :key="status.value"
                    @click="handleSelectWithStatus(item, status.value)"
                    class="w-full bg-(--neo-background) cursor-pointer px-4 py-4 text-left first:rounded-t-xl last:rounded-b-xl hover:bg-(--neo-background-body) transition-colors flex items-center gap-2"
                    :class="{
                      'bg-green-100':
                        alreadyAdded(item) &&
                        getExistingStatus(item) === status.value,
                    }"
                  >
                    <span class="text-lg text-gray-700">{{
                      status.label
                    }}</span>
                    <span
                      v-if="
                        alreadyAdded(item) &&
                        getExistingStatus(item) === status.value
                      "
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

dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
