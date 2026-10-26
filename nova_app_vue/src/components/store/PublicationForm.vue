<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Category, PublicationInput } from '@/types/store'
import { useStore } from '@/stores/store'
import { useRouteOperation } from '@/composables/useRouteOperation'
import ImagePicker from './ImagePicker.vue'
import StoreIcon from './StoreIcon.vue'
defineProps<{ categories: Category[] }>()
const store = useStore()
const router = useRouter()
const captureOperation = useRouteOperation()
const form = reactive({ name: '', description: '', category_id: '', minimum_age: 0, price: '0.00' })
const icon = ref<File | null>(null)
const screenshots = ref<(File | null)[]>([null, null, null, null])
const validation = ref('')
async function submit() {
  validation.value = ''
  if (!icon.value || screenshots.value.length !== 4 || screenshots.value.some((file) => !file)) {
    validation.value = 'Añade un icono y exactamente cuatro capturas de pantalla.'
    return
  }
  const isCurrent = captureOperation()
  const session = store.sessionVersion
  const result = await store.publish({
    ...form,
    category_id: Number(form.category_id),
    minimum_age: Number(form.minimum_age),
    icon: icon.value,
    screenshots: [...screenshots.value] as PublicationInput['screenshots'],
  })
  if (!result || session !== store.sessionVersion) return
  if (isCurrent()) await router.push(`/developer/applications/${result.application.id}?published=1`)
  else store.publicationNotice = { id: result.application.id, name: result.application.name }
}
</script>
<template>
  <section id="publish" class="store-publication">
    <div class="store-section-heading">
      <div>
        <p class="store-eyebrow">COMPARTE TU PRÓXIMA GRAN IDEA</p>
        <h2>Nueva aplicación</h2>
        <p class="store-muted">Completa los detalles y dale un lugar en AppNova.</p>
      </div>
    </div>
    <form @submit.prevent="submit">
      <div class="store-publish-grid">
        <div class="store-panel">
          <h3>Información principal</h3>
          <label class="store-field"
            >Nombre de la aplicación<input
              v-model="form.name"
              required
              maxlength="255"
              placeholder="El nombre de tu próxima gran idea" /></label
          ><label class="store-field"
            >Descripción<textarea
              v-model="form.description"
              required
              maxlength="20000"
              rows="6"
              placeholder="Cuéntanos qué hace especial a tu app…"
            />
          </label>
          <div class="store-field-grid store-field-grid-three">
            <label class="store-field"
              >Categoría<select v-model="form.category_id" required>
                <option disabled value="">Seleccionar</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select></label
            ><label class="store-field"
              >Edad mínima<input
                v-model="form.minimum_age"
                required
                type="number"
                min="0"
                max="18"
                step="1" /></label
            ><label class="store-field"
              >Precio (USD)<input
                v-model="form.price"
                required
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
            /></label>
          </div>
          <p class="store-muted store-small">
            Indica 0 para una aplicación gratuita. Las compras de pago aún no están disponibles.
          </p>
        </div>
        <div class="store-panel">
          <h3>Recursos visuales</h3>
          <p class="store-muted store-small">JPG, PNG o WebP · máximo 5 MB por imagen.</p>
          <ImagePicker
            v-model="icon"
            label="Icono de la aplicación"
            :error="store.fieldErrors.icon?.[0]"
          />
          <h4>Cuatro capturas de pantalla</h4>
          <div class="store-upload-grid">
            <ImagePicker
              v-for="(_, index) in screenshots"
              :key="index"
              v-model="screenshots[index]"
              :label="`Captura ${index + 1}`"
              :error="store.fieldErrors[`screenshots.${index}`]?.[0]"
            />
          </div>
        </div>
      </div>
      <div class="store-publish-notice">
        <StoreIcon name="check" />
        <p>
          Tu aplicación se publicará al completar el envío. No necesitas activar un pago para
          publicar.
        </p>
      </div>
      <p v-if="validation || store.actionError" class="store-alert" role="alert">
        {{ validation || store.actionError }}
      </p>
      <ul v-if="Object.keys(store.fieldErrors).length" class="store-alert">
        <li v-for="(messages, field) in store.fieldErrors" :key="field">
          {{ field }}: {{ messages[0] }}
        </li>
      </ul>
      <div class="store-form-actions">
        <span class="store-muted store-small"
          >Revisa los datos antes de compartir tu aplicación.</span
        ><button class="store-button" :disabled="store.saving">
          <StoreIcon name="plus" />{{ store.saving ? 'Publicando…' : 'Publicar aplicación' }}
        </button>
      </div>
    </form>
  </section>
</template>
