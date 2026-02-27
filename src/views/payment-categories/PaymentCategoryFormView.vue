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
const color = ref('#42b883')

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
    <div class="field">
      <label for="name">Nome</label>
      <input id="name" v-model="name" type="text" required />
    </div>
    <div class="field">
      <label for="description">Descricao</label>
      <input id="description" v-model="description" type="text" />
    </div>
    <div class="field">
      <label for="color">Cor</label>
      <input id="color" v-model="color" type="color" required />
    </div>
    <div class="actions">
      <button type="submit">Salvar</button>
      <RouterLink to="/payment-categories">Cancelar</RouterLink>
    </div>
  </form>
</template>

<style scoped>
.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.field input,
.field select {
  width: 100%;
  padding: 0.4rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.actions button {
  padding: 0.4rem 0.8rem;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
