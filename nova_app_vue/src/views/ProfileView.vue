<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '@/stores/store'
import type { ProfileInput, StoreProfile } from '@/types/store'
import { dateLabel } from '@/lib/store'
import StoreShell from '@/components/store/StoreShell.vue'
import StoreState from '@/components/store/StoreState.vue'
import StorePagination from '@/components/store/StorePagination.vue'
import AppIcon from '@/components/store/AppIcon.vue'
import ReviewCard from '@/components/store/ReviewCard.vue'
import ImagePicker from '@/components/store/ImagePicker.vue'
import StoreIcon from '@/components/store/StoreIcon.vue'
import { useRouteOperation } from '@/composables/useRouteOperation'
import { useResourceHash } from '@/composables/useResourceHash'
const route = useRoute()
const router = useRouter()
const store = useStore()
const bundle = computed(() => store.profile.data)
const editing = ref(false)
const saved = ref(false)
const captureOperation = useRouteOperation()
useResourceHash(() => !!bundle.value && !store.profile.loading)
const avatar = ref<File | null>(null)
const form = reactive({
  name: '',
  email: '',
  gender: 'prefer_not_to_say' as StoreProfile['gender'],
  birth_date: '',
  company_name: '',
})
function query() {
  const params = new URLSearchParams()
  for (const key of ['library_page', 'reviews_page'])
    if (route.query[key]) params.set(key, String(route.query[key]))
  return params.toString()
}
function load() {
  return store.loadProfile(query())
}
watch(
  () => [route.query.library_page, route.query.reviews_page],
  () => {
    store.clearAction()
    editing.value = false
    void load()
  },
  { immediate: true },
)
function edit() {
  const user = bundle.value?.profile
  if (!user) return
  Object.assign(form, {
    name: user.name,
    email: user.email,
    gender: user.gender,
    birth_date: user.birth_date,
    company_name: user.developer_profile?.company_name || '',
  })
  avatar.value = null
  saved.value = false
  editing.value = true
  store.clearAction()
}
async function save() {
  const input: ProfileInput = {
    name: form.name,
    email: form.email,
    gender: form.gender,
    birth_date: form.birth_date,
  }
  if (bundle.value?.profile.role === 'developer') input.company_name = form.company_name
  if (avatar.value) input.avatar = avatar.value
  const isCurrent = captureOperation()
  const result = await store.saveProfile(input)
  if (!isCurrent()) return
  saved.value = result
  if (saved.value) {
    editing.value = false
    avatar.value = null
    if (route.query.library_page || route.query.reviews_page)
      await router.replace({ query: {}, hash: route.hash })
  }
}
function page(key: string, value: number, hash: string) {
  void router.push({ query: { ...route.query, [key]: String(value) }, hash })
}
async function logout() {
  const { useAuthStore } = await import('@/stores/auth')
  try {
    await useAuthStore().logout()
    await router.push('/store')
  } catch {
    /* Auth message is displayed by the shell. */
  }
}
</script>
<template>
  <StoreShell title="Mi cuenta" subtitle="Tu espacio, tus aplicaciones, tus experiencias."
    ><StoreState
      :loading="store.profile.loading"
      :error="store.profile.error"
      @retry="load"
    /><template v-if="bundle && !store.profile.loading"
      ><section class="store-profile-card store-panel">
        <span class="store-avatar store-avatar-large"
          ><img
            v-if="bundle.profile.avatar_url"
            :src="bundle.profile.avatar_url"
            alt="Tu avatar"
          /><template v-else>{{ bundle.profile.name.slice(0, 1) }}</template></span
        >
        <div>
          <h2>{{ bundle.profile.name }}</h2>
          <p class="store-muted">{{ bundle.profile.email }}</p>
          <span class="store-badge">{{
            bundle.profile.role === 'developer' ? 'Desarrollador' : 'Miembro de AppNova'
          }}</span>
        </div>
        <button v-if="!editing" class="store-button store-button-secondary" @click="edit">
          Editar perfil
        </button>
      </section>
      <p v-if="saved" class="store-success" role="status">
        Tus cambios se guardaron correctamente.
      </p>
      <form v-if="editing" class="store-panel store-profile-form" @submit.prevent="save">
        <h2>Hazlo tuyo</h2>
        <div class="store-profile-edit-layout">
          <ImagePicker
            v-model="avatar"
            label="Cambiar avatar"
            :existing="bundle.profile.avatar_url"
            :max-m-b="2"
            :error="store.fieldErrors.avatar?.[0]"
          />
          <div>
            <div class="store-field-grid">
              <label class="store-field"
                >Nombre completo<input
                  v-model="form.name"
                  required
                  maxlength="255"
                  autocomplete="name" /></label
              ><label class="store-field"
                >Correo electrónico<input
                  v-model="form.email"
                  required
                  type="email"
                  maxlength="255"
                  autocomplete="email" /></label
              ><label class="store-field"
                >Género<select v-model="form.gender">
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="non_binary">No binario</option>
                  <option value="prefer_not_to_say">Prefiero no decirlo</option>
                </select></label
              ><label class="store-field"
                >Fecha de nacimiento<input
                  v-model="form.birth_date"
                  required
                  type="date"
                  :max="new Date().toLocaleDateString('en-CA')"
              /></label>
            </div>
            <label v-if="bundle.profile.role === 'developer'" class="store-field"
              >Nombre de empresa<input
                v-model="form.company_name"
                required
                maxlength="255"
                autocomplete="organization"
            /></label>
          </div>
        </div>
        <p v-if="store.actionError" class="store-alert" role="alert">{{ store.actionError }}</p>
        <ul v-if="Object.keys(store.fieldErrors).length" class="store-alert">
          <li v-for="(messages, field) in store.fieldErrors" :key="field">
            {{ field }}: {{ messages[0] }}
          </li>
        </ul>
        <div class="store-form-actions">
          <button
            type="button"
            class="store-button store-button-secondary"
            :disabled="store.saving"
            @click="editing = false"
          >
            Cancelar</button
          ><button class="store-button" :disabled="store.saving">
            <StoreIcon name="check" />{{ store.saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
      <section v-if="bundle.profile.role === 'developer'" class="store-payment-card store-panel">
        <div class="store-stat-icon"><StoreIcon name="grid" /></div>
        <div>
          <span class="store-badge">PRÓXIMAMENTE</span>
          <h2>PayPal</h2>
          <p class="store-muted">
            Los pagos estarán disponibles en una próxima actualización. Ya puedes publicar tus
            aplicaciones.
          </p>
          <RouterLink to="/developer/applications/create" class="store-link"
            >Publicar app →</RouterLink
          >
        </div>
        <button class="store-button store-button-secondary" disabled>Pagos no disponibles</button>
      </section>
      <section class="store-profile-summary">
        <div class="store-panel">
          <StoreIcon name="download" /><strong>{{ bundle.summary.downloads_count }}</strong
          ><span>Aplicaciones en tu biblioteca</span>
        </div>
        <div class="store-panel">
          <StoreIcon name="star" /><strong>{{ bundle.summary.reviews_count }}</strong
          ><span>Experiencias compartidas</span>
        </div>
      </section>
      <section id="library" class="store-library">
        <div class="store-section-heading">
          <h2>Mi biblioteca</h2>
          <RouterLink to="/store" class="store-link">Descubrir más →</RouterLink>
        </div>
        <StoreState :empty="!bundle.library.data.length" message="Tu biblioteca está por descubrir"
          ><RouterLink class="store-link" to="/store">Explora el catálogo →</RouterLink></StoreState
        >
        <div class="store-library-list">
          <article
            v-for="item in bundle.library.data"
            :key="item.id"
            class="store-panel store-library-item"
          >
            <template v-if="item.application && item.available"
              ><AppIcon
                :url="item.application.icon_url"
                :name="item.application.name"
                :id="item.application.id"
              />
              <div>
                <RouterLink :to="`/store/${item.application_id}`"
                  ><h3>{{ item.application.name }}</h3></RouterLink
                >
                <p class="store-muted">Instalada · {{ dateLabel(item.downloaded_at) }}</p>
              </div>
              <span class="store-badge store-status-approved">INSTALADA</span
              ><RouterLink
                :to="`/store/${item.application_id}#reviews`"
                class="store-link store-library-review"
                >Escribir reseña →</RouterLink
              ></template
            ><template v-else
              ><span class="store-stat-icon"><StoreIcon name="grid" /></span>
              <div>
                <h3>Aplicación no disponible</h3>
                <p class="store-muted">Instalada el {{ dateLabel(item.downloaded_at) }}</p>
              </div>
              <span class="store-badge">NO DISPONIBLE</span></template
            >
          </article>
        </div>
        <StorePagination
          :meta="bundle.library.meta"
          label="Páginas de biblioteca"
          @change="page('library_page', $event, '#library')"
        />
      </section>
      <section id="my-reviews" class="store-related">
        <div class="store-section-heading">
          <h2>Mis reseñas</h2>
          <span class="store-muted store-small">Tu opinión hace la diferencia</span>
        </div>
        <StoreState
          :empty="!bundle.reviews.data.length"
          message="Todavía no has compartido una reseña"
        />
        <div class="store-review-list">
          <div v-for="review in bundle.reviews.data" :key="review.id">
            <ReviewCard :review="review" /><RouterLink
              :to="`/store/${review.application_id}#reviews`"
              class="store-link store-edit-review"
              >Ver aplicación y editar reseña →</RouterLink
            >
          </div>
        </div>
        <StorePagination
          :meta="bundle.reviews.meta"
          label="Páginas de mis reseñas"
          @change="page('reviews_page', $event, '#my-reviews')"
        />
      </section>
      <RouterLink
        v-if="bundle.profile.role === 'developer'"
        class="store-mobile-panel-link store-button store-button-secondary"
        to="/developer/dashboard"
        >Ir a mi panel de desarrollador →</RouterLink
      ><button class="store-logout store-profile-logout" @click="logout">
        <StoreIcon name="logout" />Cerrar sesión
      </button></template
    ></StoreShell
  >
</template>
