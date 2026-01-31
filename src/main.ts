import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Инициализируем auth store перед монтированием приложения
const authStore = useAuthStore()
authStore.initialize().then(() => {
  app.mount('#app')
})

console.log('✅ App initialized')
