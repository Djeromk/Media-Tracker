<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function navigateToDashboard() {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-neo-background flex items-center justify-center px-4">
    <div class="max-w-4xl w-full text-center">
      <h1 class="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
        Media Tracker
      </h1>
      <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
        Отслеживайте фильмы, сериалы, книги и игры.
        Ставьте оценки, пишите отзывы и делитесь списками с друзьями.
      </p>

      <button
        @click="navigateToDashboard"
        class="btn-neo-primary text-lg px-10 py-4 inline-flex items-center space-x-2"
      >
        <span>{{ authStore.isAuthenticated ? 'Открыть Dashboard' : 'Начать' }}</span>
        <span>→</span>
      </button>

      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card-neo text-center">
          <div class="text-5xl mb-4">📺</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            Фильмы и сериалы
          </h3>
          <p class="text-sm text-gray-600">
            Отслеживайте просмотренное
          </p>
        </div>

        <div class="card-neo text-center">
          <div class="text-5xl mb-4">📖</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            Книги
          </h3>
          <p class="text-sm text-gray-600">
            Ведите читательский дневник
          </p>
        </div>

        <div class="card-neo text-center">
          <div class="text-5xl mb-4">🎮</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">
            Игры
          </h3>
          <p class="text-sm text-gray-600">
            Логируйте прохождения
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
