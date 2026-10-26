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
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) {
      if (to.path === '/profile' || to.path.startsWith('/store/')) return false
      return document.getElementById(decodeURIComponent(to.hash.slice(1)))
        ? { el: to.hash, top: 24 }
        : false
    }
    if (to.path === from.path) return false
    return { top: 0 }
  },
  routes: [
    { path: '/', redirect: '/store' },
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guestOnly: true } },
    {
      path: '/register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    { path: '/store', component: () => import('@/views/StoreView.vue') },
    { path: '/store/:id', component: () => import('@/views/ApplicationView.vue') },
    {
      path: '/profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/developer/dashboard',
      component: () => import('@/views/DeveloperDashboardView.vue'),
      meta: { requiresAuth: true, role: 'developer' },
    },
    {
      path: '/developer/applications',
      redirect: (to) => {
        const { publish, ...query } = to.query
        return {
          path: publish === '1' ? '/developer/applications/create' : '/developer/dashboard',
          query,
          hash: '',
        }
      },
    },
    {
      path: '/developer/applications/create',
      component: () => import('@/views/DeveloperCreateView.vue'),
      meta: { requiresAuth: true, role: 'developer' },
    },
    {
      path: '/developer/applications/:id',
      component: () => import('@/views/DeveloperApplicationView.vue'),
      meta: { requiresAuth: true, role: 'developer' },
    },
    {
      path: '/admin/dashboard',
      component: () => import('@/views/AdminDashboardView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  if (to.path === '/developer/dashboard' && to.query.publish === '1') {
    const { publish: _publish, ...query } = to.query
    return { path: '/developer/applications/create', query, hash: '', replace: true }
  }
  const auth = useAuthStore()
  await auth.initialize()

  if (to.meta.requiresAuth && !auth.user)
    return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.user) return homeForRole(auth.user.role)
  if (to.path === '/profile' && auth.user?.role === 'admin') return '/admin/dashboard'
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.user ? homeForRole(auth.user.role) : '/login'
  }
})

export default router
