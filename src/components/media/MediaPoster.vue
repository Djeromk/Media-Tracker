<script setup lang="ts">
import { Film, BookOpen } from "lucide-vue-next";
import { createImageErrorHandler } from "@/components/search/utils";
import fallbackImage from "@/assets/fallback.svg";

interface Props {
  src: string | null;
  alt: string;
  fallbackIcon?: "film" | "book";
}

const props = withDefaults(defineProps<Props>(), {
  fallbackIcon: "film",
});

const handleImageError = createImageErrorHandler(fallbackImage);
const FallbackIcon = props.fallbackIcon === "film" ? Film : BookOpen;
</script>

<template>
  <div
    class="w-55 h-72 rounded-2xl overflow-hidden shadow-neo bg-(--neo-background)"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="handleImageError"
    />
    <div
      v-else
      class="w-full h-full bg-gray-200 flex items-center justify-center"
    >
      <component :is="FallbackIcon" :size="48" class="text-gray-400" />
    </div>
  </div>
</template>
