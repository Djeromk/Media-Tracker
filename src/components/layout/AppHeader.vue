<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await authStore.signOut()
  router.push('/')
}
</script>

<template>
  <header class="bg-(--neo-background)">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <router-link
          to="/"
          class="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Media Tracker
        </router-link>

        <div class="flex items-center space-x-4">
          <template v-if="authStore.isAuthenticated">
            <router-link
              to="/my-lists"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Мои списки
            </router-link>
            <button
              @click="handleLogout"
              class="btn-neo text-sm"
            >
              Выйти
            </button>
          </template>
          <template v-else>
            <router-link
              to="/login"
              class="px-4 py-2 rounded-xl text-gray-700 hover:text-primary-600 transition-colors"
            >
              Войти
            </router-link>
            <router-link
              to="/register"
              class="btn-(--neo-primary)"
            >
              Регистрация
            </router-link>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>
