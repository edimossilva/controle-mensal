<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOwnerStore } from '@/stores/owner-store'
import { useEntityForm } from '@/composables/use-entity-form'

const store = useOwnerStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const name = ref('')

watch(existing, (entity) => {
  if (entity) {
    name.value = entity.name
  }
})

function handleSubmit() {
  if (isEditMode.value && existing.value) {
    store.update({ ...existing.value, name: name.value })
  } else {
    store.create(name.value)
  }
  router.push('/owners')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Titular' : 'Novo Titular' }}</h1>

  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="name">Nome</label>
      <input id="name" v-model="name" type="text" required />
    </div>
    <div class="flex gap-2 mt-6">
      <button type="submit" class="btn">Salvar</button>
      <RouterLink to="/owners" class="btn btn-secondary">Cancelar</RouterLink>
    </div>
  </form>
</template>
