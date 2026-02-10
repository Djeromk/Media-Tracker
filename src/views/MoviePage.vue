<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { KinopoiskItemByID, MediaStatus } from "@/types";
import { kinopoiskService } from "@/services/api/kinopoisk";
import { useMediaStore } from "@/stores/media";
import Tag from "@/components/tag/tag.vue";
import MediaStatusDropdown from "@/components/media/MediaStatusDropdown.vue";
import MediaRating from "@/components/media/MediaRating.vue";
import MediaPoster from "@/components/media/MediaPoster.vue";
import MovieRatings from "@/components/media/MovieRatings.vue";
import SeriesProgress from "@/components/series/SeriesProgress.vue";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Layers,
  Quote,
  Tv,
  Film,
  Loader,
  ExternalLink,
  MessageCircle,
} from "lucide-vue-next";
import {
  findUserMediaEntry,
  transformKinopoiskToExternalMovie,
  createStatusUpdatePayload,
  getMovieTitle,
  getMovieOriginalTitle,
  formatFilmLength,
} from "@/utils/utils";

const route = useRoute();
const router = useRouter();
const mediaStore = useMediaStore();
const movieId: string = route.params.id as string;
const movie = ref<KinopoiskItemByID | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const userMediaEntry = computed(() =>
  findUserMediaEntry(mediaStore.userMedia, movieId)
);

const currentStatus = computed(() => userMediaEntry.value?.status ?? null);

onMounted(async () => {
  if (!movieId) {
    error.value = "ID фильма не указан";
    loading.value = false;
    return;
  }
  try {
    movie.value = await kinopoiskService.searchMovieByID(movieId);
  } catch (e) {
    const err = e as Error;
    error.value = err.message || "Не удалось загрузить фильм";
  } finally {
    console.log('movie.serial && userMediaEntry', movie.value, userMediaEntry.value);
    loading.value = false;
  }
});

async function handleAddMovie(status: MediaStatus) {
  if (!movie.value) return;
  const mediaItem = transformKinopoiskToExternalMovie(movie.value);
  console.log('mediaItem', mediaItem);
  await mediaStore.addMediaFromExternal(mediaItem, "movie", status);
}

async function handleUpdateStatus(status: MediaStatus) {
  if (!userMediaEntry.value || status === currentStatus.value) return;
  const updates = createStatusUpdatePayload(status);
  console.log('updates', updates);
  await mediaStore.updateMedia(userMediaEntry.value.id, updates);
}

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

      <div v-else-if="movie" class="flex flex-col lg:flex-row gap-8">
        <div class="w-full lg:w-72 shrink-0 flex flex-col items-center gap-6">
          <MediaPoster
            :src="movie.posterUrl"
            :alt="getMovieTitle(movie)"
            fallback-icon="film"
          />
          <MediaStatusDropdown
            :user-media-entry="userMediaEntry"
            :current-status="currentStatus"
            media-type="movie"
            @add="handleAddMovie"
            @update="handleUpdateStatus"
          />
          <MediaRating v-if="userMediaEntry" :user-media-entry="userMediaEntry" />
          <SeriesProgress
            v-if="movie.serial && userMediaEntry"
            :movie-id="movieId"
            :user-media-entry="userMediaEntry"
          />
        </div>

        <div class="flex-1 flex flex-col gap-4">
          <h1 class="text-4xl font-bold text-gray-800 leading-tight">
            {{ getMovieTitle(movie) }}
          </h1>
          <p v-if="getMovieOriginalTitle(movie)" class="text-lg text-gray-500">
            {{ getMovieOriginalTitle(movie) }}
          </p>

          <!-- Слоган -->
          <div
            v-if="movie.slogan"
            class="flex items-start gap-2 text-gray-600 italic"
          >
            <Quote :size="18" class="text-primary-500 shrink-0 mt-0.5" />
            <span class="text-base">{{ movie.slogan }}</span>
          </div>

          <!-- Мета: год, длительность, тип, страны, жанры, возраст -->
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <div
              v-if="movie.year"
              class="flex items-center gap-2 text-gray-600"
            >
              <Calendar :size="18" class="text-primary-500" />
              <span class="text-base">{{ movie.year }}</span>
            </div>
            <div
              v-if="movie.filmLength"
              class="flex items-center gap-2 text-gray-600"
            >
              <Clock :size="18" class="text-primary-500" />
              <span class="text-base">{{ formatFilmLength(movie.filmLength) }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <component
                :is="movie.type === 'TV_SHOW' ? Tv : Film"
                :size="18"
                class="text-primary-500"
              />
              <span class="text-base">
                {{ movie.serial ? "Сериал" : "Фильм" }}
              </span>
            </div>

            <div
              v-if="movie.countries?.length"
              class="flex items-center gap-2 text-gray-600 flex-wrap"
            >
              <Globe :size="18" class="text-primary-500 shrink-0" />
              <span
                v-for="c in movie.countries"
                :key="c.country"
                class="text-base"
              >
                {{ c.country }}
              </span>
            </div>
          </div>

          <MovieRatings
            :rating-kinopoisk="movie.ratingKinopoisk"
            :rating-kinopoisk-vote-count="movie.ratingKinopoiskVoteCount"
            :rating-imdb="movie.ratingImdb"
            :rating-imdb-vote-count="movie.ratingImdbVoteCount"
          />

          <!-- Описание -->
          <div
            v-if="movie.description"
            class="card-neo shadow-neo outline-none p-6"
          >
            <h2 class="text-lg font-semibold text-gray-800 mb-3">Описание</h2>
            <p
              class="text-base text-gray-600 leading-relaxed whitespace-pre-line"
              v-html="movie.description"
            />

            <!-- Дополнительно: ссылка на Кинопоиск, отзывы -->
            <div v-if="movie.webUrl || movie.reviewsCount" class="pt-4">
              <h2 class="text-lg font-semibold text-gray-800 mb-3">
                Дополнительно
              </h2>
              <div class="flex flex-col gap-3 text-base text-gray-600">
                <a
                  v-if="movie.webUrl"
                  :href="movie.webUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 text-primary-600 hover:underline"
                >
                  <ExternalLink :size="18" />
                  Открыть на Кинопоиске
                </a>
                <p v-if="movie.reviewsCount" class="flex items-center gap-2">
                  <MessageCircle :size="18" class="text-primary-500" />
                  <span>Отзывов: {{ movie.reviewsCount }}</span>
                </p>
              </div>
              <div
                v-if="movie.genres?.length"
                class="flex items-center gap-2 text-gray-600 flex-wrap"
              >
                <Layers :size="18" class="text-primary-500 shrink-0" />
                <div class="flex gap-2 flex-wrap">
                  <Tag
                    v-for="g in movie.genres"
                    :key="g.genre"
                    :label="g.genre"
                    class="shadow-(--neo-shadow)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
