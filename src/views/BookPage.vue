<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ExternalBook, MediaStatus, UserMedia } from "@/types";
import { BOOKS_STATUS_LABELS } from "@/types";
import { booksService } from "@/services/api/google-books";
import { useMediaStore } from "@/stores/media";
import Tag from "@/components/tag/tag.vue";
import Slider from "@/components/slider/slider.vue";
import {
  ArrowLeft,
  BookOpen,
  Star,
  Users,
  Hash,
  Calendar,
  FileText,
  Plus,
  ChevronDown,
  Check,
  Loader,
} from "lucide-vue-next";
import fallbackImage from "@/assets/fallback.svg";

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const bookId: string = route.params.id as string;
const book = ref<ExternalBook | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const statusDropdownOpen = ref<boolean>(false);
const currentPage = ref<number | null | undefined>(0);

let currentPageTimeout: ReturnType<typeof setTimeout> | null = null;

const userMediaEntry = computed<UserMedia | null>(() => {
  return (
    mediaStore.userMedia.find((entry) => entry.media?.external_id === bookId) ??
    null
  );
});

const currentStatus = computed<MediaStatus | null>(() => {
  return userMediaEntry.value?.status ?? null;
});

const availableStatuses = computed<{ value: MediaStatus; label: string }[]>(
  () => {
    return (Object.entries(BOOKS_STATUS_LABELS) as [MediaStatus, string][]).map(
      ([value, label]) => ({ value, label })
    );
  }
);

const publicationYear = computed<string | null>(() => {
  if (!book.value?.publishedDate) return null;
  return book.value.publishedDate.substring(0, 4);
});

onMounted(async () => {
  if (!bookId) {
    error.value = "ID книги не указан";
    loading.value = false;
    return;
  }
  try {
    book.value = await booksService.getBookById(bookId);
    currentPage.value = userMediaEntry.value?.current_page;
  } catch (e) {
    const err = e as Error;
    error.value = err.message || "Не удалось загрузить книгу";
  } finally {
    loading.value = false;
  }
});

async function handleAddBook(status: MediaStatus) {
  if (!book.value) return;

  await mediaStore.addMediaFromExternal(book.value, "book", status);
  statusDropdownOpen.value = false;
}

async function handleUpdateStatus(status: MediaStatus) {
  console.log('status', status)
  if (!userMediaEntry.value) return;
  if (status === currentStatus.value) {
    statusDropdownOpen.value = false;
    return;
  }
  const updates = {
    status,
    is_finished: status == "completed",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };

  await mediaStore.updateMedia(userMediaEntry.value.id, updates);
  statusDropdownOpen.value = false;
}

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = fallbackImage;
}

watch(currentPage, (value) => {
  if (currentPageTimeout) clearTimeout(currentPageTimeout);
  currentPageTimeout = setTimeout(() => {
    if (!value) return;
    console.log("value", value);
    handleCurrentPageChange(value);
  }, 1000);
});

async function handleCurrentPageChange(value: number) {
  if (!userMediaEntry.value) return;
  await mediaStore.updateMedia(userMediaEntry.value.id, {
    currentPage: value,
  });
  currentPage.value = value;
}

console.log("userMediaEntry", userMediaEntry.value);
console.log("availableStatuses", availableStatuses.value);
</script>

<template>
  <div class="min-h-screen bg-(--neo-background-body) p-6">
    <div class="max-w-4xl mx-auto">
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-8 cursor-pointer transition-colors"
      >
        <ArrowLeft :size="20" />
        <span class="text-base">Назад</span>
      </button>

      <div v-if="loading" class="flex justify-center py-24">
        <Loader :size="48" class="text-primary-500 animate-spin" />
      </div>

      <div v-else-if="error" class="text-center py-24">
        <p class="text-red-500 text-lg">{{ error }}</p>
        <button
          @click="router.back()"
          class="mt-4 text-primary-600 hover:underline cursor-pointer"
        >
          Вернуться назад
        </button>
      </div>

      <div v-else-if="book" class="flex flex-col lg:flex-row gap-8">
        <div class="w-full lg:w-72 shrink-0 flex flex-col items-center gap-6">
          <div
            class="w-48 h-72 rounded-2xl overflow-hidden shadow-neo bg-(--neo-background)"
          >
            <img
              v-if="book.thumbnail"
              :src="book.thumbnail"
              :alt="book.title"
              class="w-full h-full object-cover"
              @error="handleImageError"
            />
            <div
              v-else
              class="w-full h-full bg-gray-200 flex items-center justify-center"
            >
              <BookOpen :size="48" class="text-gray-400" />
            </div>
          </div>
          <div class="relative w-full shadow-(--neo-shadow) rounded-2xl">
            <button
              @click="statusDropdownOpen = !statusDropdownOpen"
              class="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all shadow-neo bg-(--neo-background) hover:shadow-(--neo-shadow-sm)"
              :class="{
                'border-2 border-green-500 bg-green-50': currentStatus !== null,
              }"
            >
              <span
                class="text-base font-medium text-gray-700 flex items-center gap-2"
              >
                <span v-if="currentStatus">
                  {{ BOOKS_STATUS_LABELS[currentStatus] }}
                </span>
                <span v-else class="flex items-center gap-1">
                  <Plus :size="18" />
                  Добавить в список
                </span>
              </span>
              <ChevronDown
                :size="18"
                :class="[
                  'text-gray-500 transition-transform duration-200',
                  statusDropdownOpen ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              v-if="statusDropdownOpen"
              class="absolute left-0 right-0 top-full mt-2 z-10 rounded-xl overflow-hidden shadow-neo bg-(--neo-background)"
            >
              <button
                v-for="status in availableStatuses"
                :key="status.value"
                @click="
                  userMediaEntry
                    ? handleUpdateStatus(status.value)
                    : handleAddBook(status.value)
                "
                class="w-full px-4 py-3 text-left text-base text-gray-700 cursor-pointer hover:bg-(--neo-background) transition-colors flex items-center justify-between"
                :class="{
                  'bg-green-50': currentStatus === status.value,
                }"
              >
                <span>{{ status.label }}</span>
                <Check
                  v-if="currentStatus === status.value"
                  :size="18"
                  class="text-green-600"
                />
              </button>
            </div>
          </div>
          <div
            v-if="userMediaEntry?.status == 'in_progress' && book.pageCount"
            class="w-full card-neo shadow-neo p-4"
          >
            <p class="text-sm text-gray-500 mb-2 font-medium">
              Текущая страница
            </p>
            <div class="flex items-center gap-3">
              <Slider :max="book.pageCount" v-model="currentPage" />
            </div>
          </div>
          <div v-if="userMediaEntry" class="w-full card-neo shadow-neo p-4">
            <p class="text-sm text-gray-500 mb-2 font-medium">Ваш рейтинг</p>

            <div class="flex gap-1">
              <button
                v-for="star in 5"
                :key="star"
                @click="
                  mediaStore.updateMedia(userMediaEntry.id, {
                    rating: star,
                  })
                "
                class="cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  :size="28"
                  :class="
                    star <= (userMediaEntry.rating ?? 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  "
                />
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col gap-6">
          <h1 class="text-4xl font-bold text-gray-800 leading-tight">
            {{ book.title }}
          </h1>

          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <div
              v-if="book.authors && book.authors.length > 0"
              class="flex items-center gap-2 text-gray-600"
            >
              <Users :size="18" class="text-primary-500" />
              <span class="text-base">{{ book.authors.join(", ") }}</span>
            </div>

            <div
              v-if="book.pageCount"
              class="flex items-center gap-2 text-gray-600"
            >
              <FileText :size="18" class="text-primary-500" />
              <span class="text-base">{{ book.pageCount }} стр.</span>
            </div>

            <div
              v-if="publicationYear"
              class="flex items-center gap-2 text-gray-600"
            >
              <Calendar :size="18" class="text-primary-500" />
              <span class="text-base">{{ publicationYear }}</span>
            </div>

            <div v-if="book.isbn" class="flex items-center gap-2 text-gray-600">
              <Hash :size="18" class="text-primary-500" />
              <span class="text-base">ISBN: {{ book.isbn }}</span>
            </div>
          </div>

          <div v-if="book.description" class="card-neo shadow-neo p-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Описание</h2>
            <p
              class="text-base text-gray-600 leading-relaxed mb-4"
              v-html="book.description"
            />



          <!-- Дополнительная информация (издатель, категории, рейтинг Google) -->
          <div
            v-if="book.publisher || book.categories || book.averageRating"
          >
          <hr class="py-4 border-gray-300"/>
            <h2 class="text-lg font-semibold text-gray-800 mb-3">
              Дополнительно
            </h2>
            <div class="flex flex-col gap-2 text-base text-gray-600">
              <p v-if="book.publisher">
                <span class="font-medium">Издатель:</span> {{ book.publisher }}
              </p>
              <div
                v-if="book.categories && book.categories.length > 0"
                class="flex gap-2 flex-wrap"
              >
                <Tag
                  v-for="category in book.categories"
                  :key="category"
                  :label="category.split('/').concat(' ').join('') || category"
                />
              </div>
              <p v-if="book.averageRating">
                <span class="font-medium">Рейтинг Google:</span>
                {{ book.averageRating }} / 5
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
<!-- <script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import { booksService } from '@/services/api/google-books';
import type { ExternalBook } from '@/types';

const route = useRoute();
const book = ref<ExternalBook | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  const id = route.params.id as string;
  if (!id) {
    error.value = 'ID книги не указан';
    loading.value = false;
    return;
  }
  try {
    const result = await booksService.getBookById(id);
    book.value = result;
    console.log('Book fetched:', result);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Не удалось загрузить книгу';
    console.error('Book fetch error:', e);
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-3xl font-bold">Страница Книги по ID</h1>
    <p>ID из URL: {{ $route.params.id }}</p>

    <div v-if="loading">Загрузка...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else-if="book" class="flex flex-col gap-2">
      <img
        v-if="book.thumbnail"
        :src="book.thumbnail"
        :alt="book.title"
        class="w-32 rounded shadow"
      />
      <h2 class="text-xl font-semibold">{{ book.title }}</h2>
      <p v-if="book.authors?.length">Авторы: {{ book.authors.join(', ') }}</p>
      <p v-if="book.publishedDate">Дата издания: {{ book.publishedDate }}</p>
      <p v-if="book.pageCount">Страниц: {{ book.pageCount }}</p>
      <p v-if="book.isbn">ISBN: {{ book.isbn }}</p>
      <p v-if="book.description" class="text-gray-600">{{ book.description }}</p>
      <p v-if="book.language">Язык: {{ book.language }}</p>
      <p v-if="book.mainCategory">Главная категория: {{ book.mainCategory }}</p>
      <p v-if="book.categories?.length">Категории: {{ book.categories.join(', ') }}</p>
      <p v-if="book.averageRating">Рейтинг: {{ book.averageRating }}</p>
      <p v-if="book.previewLink">Ссылка на книгу: {{ book.previewLink }}</p>
      <p v-if="book.infoLink">Ссылка на книгу: {{ book.infoLink }}</p>
      <p v-if="book.canonicalVolumeLink">Ссылка на книгу: {{ book.canonicalVolumeLink }}</p>
      <p v-if="book.publisher">Издатель: {{ book.publisher }}</p>
    </div>
  </div>
</template> -->
