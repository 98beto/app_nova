import { createRouter, createWebHistory } from 'vue-router'
import { homeForRole, useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean
    requiresAuth?: boolean
    role?: 'user' | 'developer' | 'admin'
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guestOnly: true } },
    { path: '/store', component: () => import('@/views/StoreView.vue'), meta: { requiresAuth: true, role: 'user' } },
    { path: '/developer/dashboard', component: () => import('@/views/DeveloperDashboardView.vue'), meta: { requiresAuth: true, role: 'developer' } },
    { path: '/admin/dashboard', component: () => import('@/views/AdminDashboardView.vue'), meta: { requiresAuth: true, role: 'admin' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.requiresAuth && !auth.user) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.user) return homeForRole(auth.user.role)
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.user ? homeForRole(auth.user.role) : '/login'
  }
})

export default router
