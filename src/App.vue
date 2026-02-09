<script setup lang="ts">
//import { onMounted } from 'vue'
//import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/layout/AppHeader.vue'
import Footer from './components/layout/Footer.vue';
import AppWrapper from '@/AppWrapper.vue'
//import { useMediaStore } from '@/stores/media'

// const authStore = useAuthStore()
// const mediaStore = useMediaStore()

</script>

<template>
  <div id="app" class="min-h-screen">
    <AppHeader />
    <main>
      <Suspense>
        <template #default>
          <AppWrapper />
        </template>
        <template #fallback>
          <div class="flex justify-center items-center h-screen">
            Загрузка...
          </div>
        </template>
      </Suspense>
    </main>
    <Footer />
  </div>
</template>

<style scoped>
#app {
  /* font-family: system-ui, -apple-system, sans-serif; */
}
</style>
