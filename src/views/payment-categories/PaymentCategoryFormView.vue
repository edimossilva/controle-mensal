<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { useEntityForm } from '@/composables/use-entity-form'

const store = usePaymentCategoryStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const name = ref('')
const description = ref('')
const color = ref('#22d3ee')

watch(existing, (entity) => {
  if (entity) {
    name.value = entity.name
    description.value = entity.description ?? ''
    color.value = entity.color
  }
})

function handleSubmit() {
  if (isEditMode.value && existing.value) {
    store.update({
      ...existing.value,
      name: name.value,
      description: description.value || undefined,
      color: color.value,
    })
  } else {
    store.create(name.value, color.value, description.value || undefined)
  }
  router.push('/payment-categories')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Categoria' : 'Nova Categoria' }}</h1>

  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="name">Nome</label>
      <input id="name" v-model="name" type="text" required />
    </div>
    <div class="form-group">
      <label for="description">Descricao</label>
      <input id="description" v-model="description" type="text" />
    </div>
    <div class="form-group">
      <label for="color">Cor</label>
      <input id="color" v-model="color" type="color" required />
    </div>
    <div class="flex gap-2 mt-6">
      <button type="submit" class="btn">Salvar</button>
      <RouterLink to="/payment-categories" class="btn btn-secondary">Cancelar</RouterLink>
    </div>
  </form>
</template>
