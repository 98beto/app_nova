<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useStore } from '@/stores/store'
import StoreIcon from './StoreIcon.vue'
defineProps<{ title: string; subtitle?: string }>()
const auth = useAuthStore()
const store = useStore()
const route = useRoute()
const router = useRouter()
const developerArea = computed(
  () =>
    route.path.startsWith('/developer') ||
    (['/profile', '/library'].includes(route.path) && auth.user?.role === 'developer'),
)
const links = computed(() =>
  developerArea.value
    ? [
        {
          to: '/developer/dashboard',
          label: 'Dashboard',
          icon: 'chart',
          active:
            route.path === '/developer/dashboard' ||
            (route.path.startsWith('/developer/applications/') &&
              route.path !== '/developer/applications/create'),
        },
        {
          to: '/developer/applications/create',
          label: 'Publicar app',
          icon: 'plus',
          active: route.path === '/developer/applications/create',
        },
        {
          to: '/library',
          label: 'Biblioteca',
          icon: 'download',
          active: route.path === '/library',
        },
        { to: '/profile', label: 'Mi cuenta', icon: 'user', active: route.path === '/profile' },
      ]
    : [
        {
          to: '/store',
          label: 'Inicio',
          icon: 'home',
          active: route.path === '/store' && !Object.keys(route.query).length,
        },
        {
          to: '/store?sort=trending',
          label: 'Explorar',
          icon: 'grid',
          active:
            route.path.startsWith('/store') &&
            (route.path !== '/store' || !!Object.keys(route.query).length),
        },
        {
          to: '/library',
          label: 'Biblioteca',
          icon: 'download',
          active: route.path === '/library',
        },
        {
          to: '/profile',
          label: 'Mi cuenta',
          icon: 'user',
          active: route.path === '/profile',
        },
      ],
)
async function logout() {
  try {
    await auth.logout()
    await router.push('/store')
  } catch {
    /* Auth store exposes the error. */
  }
}
</script>
<template>
  <div class="store-shell">
    <a class="store-skip" href="#store-content">Saltar al contenido</a>
    <aside class="store-sidebar">
      <RouterLink class="store-logo" to="/store"
        ><span class="store-logo-mark"><StoreIcon name="spark" /></span
        ><span>App<span>Nova</span></span></RouterLink
      >
      <p class="store-nav-caption">
        {{ developerArea ? 'ESPACIO DE DESARROLLADOR' : 'DESCUBRE TU PRÓXIMA APP' }}
      </p>
      <nav class="store-nav" aria-label="Navegación principal">
        <RouterLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          :class="{ 'store-nav-active': link.active }"
          :aria-current="link.active ? 'page' : undefined"
          ><StoreIcon :name="link.icon" /><span>{{ link.label }}</span></RouterLink
        >
      </nav>
      <RouterLink
        v-if="auth.user?.role === 'developer'"
        class="store-switch"
        :to="developerArea ? '/store' : '/developer/dashboard'"
        ><StoreIcon :name="developerArea ? 'grid' : 'chart'" />{{
          developerArea ? 'Ir a la tienda' : 'Panel de desarrollador'
        }}<StoreIcon name="arrow"
      /></RouterLink>
      <div class="store-sidebar-bottom">
        <template v-if="auth.user"
          ><RouterLink to="/profile" class="store-identity"
            ><img v-if="auth.user.avatar_url" :src="auth.user.avatar_url" alt="" /><span
              v-else
              class="store-avatar"
              >{{ auth.user.name.slice(0, 1) }}</span
            ><span
              ><strong>{{ auth.user.name }}</strong
              ><small>{{
                auth.user.role === 'developer' ? 'Desarrollador' : 'Usuario'
              }}</small></span
            ></RouterLink
          ><button class="store-logout" :disabled="auth.loading" @click="logout">
            <StoreIcon name="logout" /> Cerrar sesión
          </button></template
        >
        <RouterLink v-else class="store-button" to="/login">Iniciar sesión</RouterLink>
      </div>
    </aside>
    <main id="store-content" class="store-main">
      <header class="store-header">
        <div>
          <p class="store-eyebrow">
            {{ developerArea ? 'CREA. COMPARTE. INSPIRA.' : 'UN MUNDO DE POSIBILIDADES' }}
          </p>
          <h1>{{ title }}</h1>
          <p v-if="subtitle" class="store-muted">{{ subtitle }}</p>
        </div>
        <div class="store-header-actions">
          <RouterLink
            v-if="auth.user?.role === 'developer'"
            class="store-header-developer store-button store-button-secondary"
            :to="developerArea ? '/store' : '/developer/dashboard'"
            >{{ developerArea ? 'Ver tienda' : 'Mi panel' }}</RouterLink
          ><RouterLink
            v-if="auth.user"
            to="/profile"
            class="store-avatar"
            :aria-label="`Perfil de ${auth.user.name}`"
            ><img v-if="auth.user.avatar_url" :src="auth.user.avatar_url" alt="" /><template
              v-else
              >{{ auth.user.name.slice(0, 1) }}</template
            ></RouterLink
          ><RouterLink v-else to="/login" class="store-button store-button-secondary"
            >Entrar</RouterLink
          >
        </div>
      </header>
      <p v-if="auth.message" class="store-alert" role="alert">{{ auth.message }}</p>
      <slot />
      <p v-if="store.publicationNotice" class="store-success store-panel" role="status">
        {{ store.publicationNotice.name }} se ha publicado.
        <RouterLink class="store-link" :to="`/developer/applications/${store.publicationNotice.id}`"
          >Ver aplicación →</RouterLink
        ><button
          class="store-link"
          aria-label="Cerrar confirmación de publicación"
          @click="store.publicationNotice = null"
        >
          Cerrar
        </button>
      </p>
      <footer class="store-footer">
        <span>AppNova · Encuentra lo que te mueve.</span><span>Hecho para descubrir.</span>
      </footer>
    </main>
    <nav class="store-bottom-nav" aria-label="Navegación móvil">
      <RouterLink
        v-for="link in links"
        :key="link.label"
        :to="link.to"
        :class="{ 'store-nav-active': link.active }"
        :aria-current="link.active ? 'page' : undefined"
        ><StoreIcon :name="link.icon" /><span>{{ link.label }}</span></RouterLink
      >
    </nav>
  </div>
</template>
