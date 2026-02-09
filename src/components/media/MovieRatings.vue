<script setup lang="ts">
import { Star } from "lucide-vue-next";

interface Props {
  ratingKinopoisk?: number;
  ratingKinopoiskVoteCount?: number;
  ratingImdb?: number;
  ratingImdbVoteCount?: number;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-wrap gap-6">
    <div
      v-if="ratingKinopoisk"
      class="flex items-center gap-2 px-4 py-2 rounded-xl shadow-(--neo-shadow)"
    >
      <Star :size="20" class="" />
      <span class="font-semibold text-gray-800">Кинопоиск:</span>
      <span
        class="text-lg font-bold"
        :class="{
          'text-amber-700': ratingKinopoisk <= 7,
          'text-green-700': ratingKinopoisk > 7,
        }"
      >
        {{ ratingKinopoisk }}
      </span>
      <span v-if="ratingKinopoiskVoteCount" class="text-sm text-gray-500">
        ({{ ratingKinopoiskVoteCount }})
      </span>
    </div>
    <div
      v-if="ratingImdb"
      class="flex items-center gap-2 px-4 py-2 rounded-xl shadow-(--neo-shadow)"
    >
      <Star :size="20" />
      <span class="font-semibold text-gray-800">IMDB:</span>
      <span
        class="text-lg font-bold"
        :class="{
          'text-yellow-700': ratingImdb <= 7,
          'text-green-700': ratingImdb > 7,
        }"
      >
        {{ ratingImdb }}
      </span>
      <span v-if="ratingImdbVoteCount" class="text-sm text-gray-500">
        ({{ ratingImdbVoteCount }})
      </span>
    </div>
  </div>
</template>
