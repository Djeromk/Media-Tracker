<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'

const authStore = useAuthStore()
const mediaStore = useMediaStore()

// onMounted(async () => {
//   await authStore.initialize()
//   //await mediaStore.fetchUserMedia()
// })

// if (authStore.user) {
//   await mediaStore.fetchUserMedia()
// }

await authStore.initialize()
await new Promise(resolve => setTimeout(resolve, 2000))
// Если пользователь авторизован — загружаем его медиа
if (authStore.user) {
  await mediaStore.fetchUserMedia()
}
</script>

<template>
  <router-view />
</template>
