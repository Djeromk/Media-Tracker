<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type {
  MediaType,
  MediaStatus,
  ExternalBook,
  ExternalGame,
  ExternalMovie,
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

interface EnrichedSearchResult {
  item: ExternalMovie | ExternalBook | ExternalGame;
  /** Внешний ID из стороннего API — используется как ключ для v-for и поиска совпадений */
  id: string;
  /** true если этот элемент уже добавлен в коллекцию пользователя */
  isAdded: boolean;
  /** Текущий статус в коллекции, null если элемент не добавлен */
  currentStatus: MediaStatus | null;
  /** ID записи в таблице user_media — нужен для обновления статуса */
  userMediaId: string | null;
}

interface DropdownCoords {
  top: number;
  right: number;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref("");
const mediaStore = useMediaStore();
const searchResults = ref<(ExternalMovie | ExternalBook | ExternalGame)[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const itemRef = ref<HTMLElement[]>([]);
const activeIndex = ref(-1);

const inputRef = ref<HTMLInputElement | null>(null);

function moveFocus(delta: number) {
  const total = enrichedResults.value.length;
  if (total === 0) return;

  const next = activeIndex.value + delta;
  if (next < 0) {
    activeIndex.value = -1;
    inputRef.value?.focus();
    return;
  }
  if (next >= total) return;

  activeIndex.value = next;
  itemRef.value[next]?.focus();
}

const activeDropdown = ref<string | null>(null);
const dropdownCoords = ref<DropdownCoords>({ top: 0, right: 0 });
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Computed: обогащённые результаты поиска.
 *
 * Берём сырые результаты из API и для каждого проверяем,
 * есть ли он в коллекции пользователя (mediaStore.userMedia).
 * Сравнение по media.external_id — ID из внешнего API, который
 * сохраняется при добавлении элемента в коллекцию.
 *
 * Вынесено в computed, чтобы template не вызывал эти вычисления
 * заново для каждого элемента при каждом рендере.
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
      currentStatus: userMediaItem?.status ?? null,
      userMediaId: userMediaItem?.id ?? null,
    };
  });
});

watch(enrichedResults, () => {
  activeIndex.value = -1;
});

/** Список доступных статусов зависит от типа медиа */
const availableStatuses = computed(() => getAvailableStatuses(props.mediaType));
const placeholder = computed(() => getSearchPlaceholder(props.mediaType));

/**
 * Активный результат — элемент, чей дропдаун сейчас открыт.
 * Нужен в блоке Teleport: он находится вне v-for и не имеет
 * прямого доступа к переменной result текущей итерации.
 */
const activeResult = computed<EnrichedSearchResult | undefined>(() =>
  enrichedResults.value.find((r) => r.id === activeDropdown.value),
);

function getIconComponent(
  iconName: string,
): typeof Archive | typeof ClockFading | typeof CircleCheckBig | null {
  const icons: Record<
    string,
    typeof Archive | typeof ClockFading | typeof CircleCheckBig
  > = {
    Archive,
    ClockFading,
    CircleCheckBig,
  };
  return icons[iconName] ?? null;
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
    const err = e instanceof Error ? e : new Error("Неизвестная ошибка");
    error.value = err.message || "Ошибка поиска";
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  searchQuery.value = "";
  searchResults.value = [];
  activeDropdown.value = null;
  emit("close");
}

const handleImageError = createImageErrorHandler(fallbackImage);

/**
 * Открывает/закрывает дропдаун для конкретного элемента.
 *
 * При открытии измеряем координаты кнопки через getBoundingClientRect()
 * и сохраняем в dropdownCoords. Дропдаун рендерится через Teleport в <body>
 * с position:fixed — поэтому нужны координаты относительно viewport.
 *
 * Teleport нужен, чтобы overflow:auto/hidden на родительских контейнерах
 * (скролл-список, модалка) не обрезали дропдаун визуально.
 *
 * @param itemId — ID элемента в списке результатов
 * @param event  — MouseEvent клика на кнопку; из currentTarget берём HTMLElement
 */
function toggleDropdown(itemId: string, event: MouseEvent | KeyboardEvent) {
  // Закрываем если уже открыт
  if (activeDropdown.value === itemId) {
    activeDropdown.value = null;
    return;
  }
  const button = event.currentTarget as HTMLButtonElement;
  const rect = button.getBoundingClientRect();

  const estimatedDropdownHeight = availableStatuses.value.length * 44 + 8;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < estimatedDropdownHeight;

  dropdownCoords.value = {
    top: openUpward ? rect.top - estimatedDropdownHeight - 6 : rect.bottom + 6,
    right: window.innerWidth - rect.right,
  };

  activeDropdown.value = itemId;
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
    await mediaStore.updateMedia(result.userMediaId, {
      status,
      is_finished: status === "completed",
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });
    activeDropdown.value = null;
    return;
  }

  emit("select", result.item, status);
  activeDropdown.value = null;
  // handleClose();
}

const vFocus = {
  mounted: (el: HTMLElement) => {
    el.focus();
  },
};
</script>

<template>
  <!-- Overlay: затемнённый фон; клик вне модалки закрывает её -->
  <Transition name="fade">
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="handleClose"
      @keydown.esc="handleClose"
    >

      <div
        class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        @click="activeDropdown = null"
      >
        <div
          class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0"
        >
          <h2 class="text-lg font-bold text-gray-900">
            Добавить {{ MEDIA_TYPE_LABELS[mediaType] }}
          </h2>
          <button
            @click="handleClose"
            class="w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="px-6 py-3 shrink-0">
          <input
            ref="inputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="placeholder"
            class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all text-sm"
            autofocus
            v-focus
            @click.stop
            @keydown.down.prevent="moveFocus(1)"
          />
        </div>

        <div v-if="loading" class="flex justify-center py-10 flex-1">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
          />
        </div>

        <div v-else-if="error" class="text-center py-10 flex-1 px-6">
          <p class="text-sm text-red-500">{{ error }}</p>
        </div>

        <div
          v-else-if="enrichedResults.length > 0"
          class="overflow-y-auto flex-1 px-4 pb-3"
        >
          <ul class="space-y-0.5 pt-1">
            <li
              v-for="result in enrichedResults"
              :key="result.id"
              ref="itemRef"
              tabindex="0"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              @click.stop
              @keydown.down.prevent="moveFocus(1)"
              @keydown.up.prevent="moveFocus(-1)"
              @keydown.esc="handleClose"
              @keydown.enter.prevent="toggleDropdown(result.id, $event)"
            >
              <div
                class="w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-sm"
              >
                <img
                  v-if="getImage(result.item)"
                  :src="getImage(result.item)!"
                  :alt="getTitle(result.item)"
                  loading="lazy"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-gray-300 text-base"
                >
                  📄
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <router-link :to="`/${mediaType}s/${result.item.id}`">
                  <h3
                    class="font-semibold text-sm text-gray-900 truncate hover:text-primary-600 transition-colors leading-snug"
                  >
                    {{ getTitle(result.item) }}
                  </h3>
                </router-link>

                <p class="text-xs text-gray-500 mt-0.5 truncate leading-tight">
                  {{ getSubtitle(result.item) }}
                </p>

                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="text-xs text-gray-400">
                    {{ getReleaseDate(result.item) }}
                  </span>

                  <span
                    v-if="
                      mediaType === 'game' &&
                      'metacritic' in result.item &&
                      result.item.metacritic &&
                      result.item.metacritic > 0
                    "
                    class="inline-flex items-center justify-center w-6 h-6 rounded text-white text-[10px] font-bold"
                    :class="{
                      'bg-green-500': result.item.metacritic >= 75,
                      'bg-yellow-500':
                        result.item.metacritic < 75 &&
                        result.item.metacritic >= 50,
                      'bg-red-500': result.item.metacritic < 50,
                    }"
                  >
                    {{ getMetacritic(result.item) }}
                  </span>

                  <!-- Рейтинги фильмов -->
                  <template v-if="mediaType === 'movie'">
                    <span
                      v-if="
                        'ratingKinopoisk' in result.item &&
                        result.item.ratingKinopoisk
                      "
                      class="text-xs text-gray-400"
                    >
                      КП:
                      <span class="font-semibold text-gray-600">
                        {{ result.item.ratingKinopoisk }}
                      </span>
                    </span>
                    <span
                      v-if="
                        'ratingImdb' in result.item && result.item.ratingImdb
                      "
                      class="text-xs text-gray-400"
                    >
                      IMDb:
                      <span class="font-semibold text-gray-600">
                        {{ result.item.ratingImdb }}
                      </span>
                    </span>
                  </template>

                  <!-- Страницы для книг -->
                  <span
                    v-if="
                      mediaType === 'book' &&
                      'pageCount' in result.item &&
                      result.item.pageCount
                    "
                    class="text-xs text-gray-400"
                  >
                    {{ result.item.pageCount }} стр.
                  </span>
                </div>
              </div>

              <!-- Кнопка добавить / сменить статус -->
              <div class="shrink-0" @click.stop>
                <!-- Уже добавлено — кнопка со статусом -->
                <button
                  v-if="result.isAdded"
                  @click="(e) => toggleDropdown(result.id, e)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 border-green-400 bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <component
                    :is="getIconComponent(getStatusIcon(result.currentStatus))"
                    :size="13"
                    class="shrink-0"
                  />
                  <span class="max-w-[80px] truncate">
                    {{ getStatusLabel(mediaType, result.currentStatus) }}
                  </span>
                  <ChevronDown
                    :size="11"
                    :class="[
                      'transition-transform duration-200 shrink-0',
                      activeDropdown === result.id ? 'rotate-180' : '',
                    ]"
                  />
                </button>

                <!-- Ещё не добавлено -->
                <button
                  v-else
                  @click="(e) => toggleDropdown(result.id, e)"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border-2 border-gray-200 bg-white text-gray-600 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 active:bg-primary-100 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Добавить</span>
                  <ChevronDown
                    :size="11"
                    :class="[
                      'transition-transform duration-200 shrink-0',
                      activeDropdown === result.id ? 'rotate-180' : '',
                    ]"
                  />
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Пустой результат поиска -->
        <div
          v-else-if="searchQuery.length >= 2"
          class="text-center py-10 text-gray-400 flex-1 text-sm"
        >
          Ничего не найдено
        </div>

        <!-- Ожидание ввода -->
        <div v-else class="text-center py-10 text-gray-400 flex-1 text-sm">
          Введите название для поиска
        </div>
      </div>
    </div>
  </Transition>

  <!--
    Дропдаун статуса через Teleport.

    Проблема без Teleport: дропдаун — потомок скролл-контейнера с overflow:auto.
    Браузер обрезает position:absolute потомков когда на предке стоит overflow
    отличный от visible, даже при высоком z-index. У последних элементов списка
    дропдаун не вылезает вниз — он встраивается в контейнер, вызывая скролл.

    Решение: Teleport переносит разметку прямо в <body>, за пределы всех
    overflow-контейнеров. Позиция задаётся через position:fixed + числовые
    координаты viewport из dropdownCoords, вычисленные при клике на кнопку.

    activeResult — computed, который находит нужный EnrichedSearchResult
    по activeDropdown ID. Нужен потому, что Teleport-блок находится вне v-for
    и не имеет доступа к переменной result текущей итерации.
  -->
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="activeDropdown !== null && activeResult !== undefined"
        class="fixed z-9999"
        :style="{
          top: dropdownCoords.top + 'px',
          right: dropdownCoords.right + 'px',
        }"
        @click.stop
      >
        <div
          class="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-w-[164px] py-1"
        >
          <button
            v-for="status in availableStatuses"
            :key="status.value"
            @click="handleSelectWithStatus(activeResult, status.value)"
            :disabled="isCurrentStatus(activeResult, status.value)"
            class="w-full cursor-pointer px-4 py-2.5 text-left transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            :class="
              isCurrentStatus(activeResult, status.value)
                ? 'bg-green-50 text-green-700'
                : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            "
          >
            <span class="text-sm font-medium flex-1">{{ status.label }}</span>
            <Check
              v-if="isCurrentStatus(activeResult, status.value)"
              :size="13"
              class="text-green-600 shrink-0"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
