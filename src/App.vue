<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import Footer from './components/layout/Footer.vue';

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initialize()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <AppHeader />
    <main>
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
#app {
  font-family: system-ui, -apple-system, sans-serif;
}
</style>
