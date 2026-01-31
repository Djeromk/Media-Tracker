<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const name = ref('') // Добавлено поле имени
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value || !name.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Пожалуйста, заполните все поля'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Пароли не совпадают'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  if (name.value.trim().length < 2) {
    errorMessage.value = 'Имя должно быть не менее 2 символов'
    return
  }

  const result = await authStore.signUp(email.value, password.value, name.value)

  if (result.success) {
    successMessage.value = 'Аккаунт успешно создан! Пожалуйста, проверьте свой почтовый ящик.'
    setTimeout(() => {
      router.push('/')
    }, 2000)
  } else {
    errorMessage.value = result.error || 'Регистрация не удалась'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Создайте аккаунт
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Или
          <router-link to="/login" class="text-primary-600 hover:text-primary-500">
            Войти в существующий аккаунт
          </router-link>
        </p>
      </div>

      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Адрес электронной почты
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Ваше имя
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Алиса"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Пароль
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
            />
            <p class="mt-1 text-xs text-gray-500">Не менее 6 символов</p>
          </div>
          <div>
            <label for="confirm-password" class="block text-sm font-medium text-gray-700">
              Подтвердите пароль
            </label>
            <input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <!-- Сообщения об ошибках -->
        <div v-if="errorMessage" class="text-red-600 text-sm text-center">
          {{ errorMessage }}
        </div>

        <!-- Сообщение об успехе -->
        <div v-if="successMessage" class="text-green-600 text-sm text-center">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="btn-add w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="authStore.loading">Создаем аккаунт...</span>
          <span v-else>Создать аккаунт</span>
        </button>

        <div class="text-center">
          <router-link
            to="/"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Продолжить без аккаунта
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
