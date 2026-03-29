<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useMediaStore } from '@/stores/media'

const authStore = useAuthStore()
const mediaStore = useMediaStore()

//await authStore.initialize()
//await new Promise(resolve => setTimeout(resolve, 2000))
// Если пользователь авторизован — загружаем его медиа
if (authStore.user) {
  await mediaStore.fetchUserMedia()
}
</script>

<template>
  <router-view />
</template>
