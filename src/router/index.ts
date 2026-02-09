import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw,  } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  // {
  //   path: '/',
  //   name: 'home',
  //   component: () => import('@/views/Home.vue'),
  //   meta: { requiresAuth: false }
  // },
//   {
//     path: '/search',
//     name: 'search',
//     component: () => import('@/views/Search.vue'),
//     meta: { requiresAuth: false }
//   },
   {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: false }
  },
  // {
  //   path: '/media/:type/:id',
  //   name: 'media-page',
  //   component: () => import('@/views/MediaPage.vue'),
  //   meta: { requiresAuth: false }
  // },
  {
    path: '/books/:id',
    name: 'book-page',
    component: () => import('@/views/BookPage.vue'),
    //meta: { requiresAuth: false },
    props: true
  },

  {
    path: '/movies/:id',
    name: 'movie-page',
    component: () => import('@/views/MoviePage.vue'),
    //meta: { requiresAuth: false },
    props: true
  },
//   {
//     path: '/my-lists',
//     name: 'my-lists',
//     component: () => import('@/views/MyLists.vue'),
//     meta: { requiresAuth: true }
//   },
//   {
//     path: '/profile/:username',
//     name: 'public-profile',
//     component: () => import('@/views/PublicProfile.vue'),
//     meta: { requiresAuth: false }
//   },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/{auth}/Login.vue'),
    meta: { requiresAuth: false, guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/{auth}/Register.vue'),
    meta: { requiresAuth: false, guestOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard - проверяет аутентификацию перед переходом на страницу
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth as boolean
  const guestOnly = to.meta.guestOnly as boolean

  // Если страница требует авторизации, но пользователь не залогинен
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  }
  // Если это страница только для гостей (login/register), но пользователь уже залогинен
  else if (guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  }
  else {
    next()
  }
})

export default router
