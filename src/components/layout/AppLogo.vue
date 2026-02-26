<script setup lang="ts">
import { LaptopMinimalCheck } from "lucide-vue-next";
</script>

<template>
  <router-link
    to="/"
    class="flex items-center gap-2 no-underline select-none group"
    aria-label="TRACKmy — на главную"
  >
    <LaptopMinimalCheck
      :size="24"
      class="text-(--primary-500) transition-colors duration-(--transition-base) group-hover:text-(--primary-600)"
    />

    <span class="text-2xl font-bold tracking-tight text-(--text-primary) leading-none">
      TRACK<span class="text-(--primary-500) font-medium group-hover:text-(--primary-600) transition-colors duration-(--transition-base)">my</span>
    </span>
  </router-link>
</template>
