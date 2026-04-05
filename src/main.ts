import './styles/style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.config.errorHandler = (err: unknown, instance, info: string): void => {
  const error = err instanceof Error ? err : new Error(String(err))

  console.error(
    '[App Error]',
    '\nСообщение:', error.message,
    '\nКонтекст:', info,
    '\nКомпонент:', instance?.$options?.name ?? 'неизвестен',
    '\nСтек:', error.stack
  )
}

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Неизвестная ошибка Promise'))

  console.error(
    '[Unhandled Promise Rejection]',
    '\nСообщение:', error.message,
    '\nСтек:', error.stack
  )

  /**
   * Предотвращаем стандартный вывод браузера в консоль
   * (он менее информативен чем наш).
   * Раскомментируй если хочешь скрыть дублирование в DevTools:
   */
  // event.preventDefault()
})

// Инициализируем auth store перед монтированием приложения
const authStore = useAuthStore()

// Добавляем таймаут для инициализации (макс 5 секунд)
Promise.race([
  authStore.initialize(),
  new Promise<void>((_, reject) => 
    setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
  )
]).catch((err) => {
  console.error('[v0] Auth initialization error:', err.message)
  // Продолжаем загрузку приложения даже если auth сломан
}).finally(() => {
  console.log('[v0] Mounting app...')
  app.mount('#app')
})
