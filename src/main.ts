import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { gamesService } from './services/api/games'
//import { booksService } from './services/api/google-books'
//import { kinopoiskService } from './services/api/kinopoisk'

createApp(App).mount('#app')

console.log('✅ App initialized')
console.log('RAWG: ', gamesService.searchGames('uncharted'))
//console.log('Supabase URL:', process.env.VITE_SUPABASE_URL)
//console.log('Kinopoisk API:', import.meta.env.VITE_KINOPOISK_API_KEY)
//console.log('Books Google: ', booksService.searchBooks('кубок огня'))
//console.log('Kinopoisk test: ', kinopoiskService.searchMovies('Matrix'))
