<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { useEntityForm } from '@/composables/use-entity-form'

const store = usePaymentTemplateStore()
const ownerStore = useOwnerStore()
const categoryStore = usePaymentCategoryStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const name = ref('')
const description = ref('')
const dueDateDay = ref<number | undefined>()
const value = ref(0)
const website = ref('')
const websiteUsername = ref('')
const websitePassword = ref('')
const ownerId = ref('')
const categoryId = ref('')

onMounted(() => {
  ownerStore.loadAll()
  categoryStore.loadAll()
})

watch(existing, (entity) => {
  if (entity) {
    name.value = entity.name
    description.value = entity.description ?? ''
    dueDateDay.value = entity.dueDateDay
    value.value = entity.value
    website.value = entity.website ?? ''
    websiteUsername.value = entity.websiteUsername ?? ''
    websitePassword.value = entity.websitePassword ?? ''
    ownerId.value = entity.ownerId
    categoryId.value = entity.categoryId
  }
})

function handleSubmit() {
  if (isEditMode.value && existing.value) {
    store.update({
      ...existing.value,
      name: name.value,
      description: description.value || undefined,
      dueDateDay: dueDateDay.value,
      value: value.value,
      website: website.value || undefined,
      websiteUsername: websiteUsername.value || undefined,
      websitePassword: websitePassword.value || undefined,
      ownerId: ownerId.value,
      categoryId: categoryId.value,
    })
  } else {
    store.create({
      name: name.value,
      description: description.value || undefined,
      dueDateDay: dueDateDay.value,
      value: value.value,
      website: website.value || undefined,
      websiteUsername: websiteUsername.value || undefined,
      websitePassword: websitePassword.value || undefined,
      ownerId: ownerId.value,
      categoryId: categoryId.value,
    })
  }

  if (store.error) return
  router.push('/payment-templates')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Modelo' : 'Novo Modelo' }}</h1>

  <p v-if="store.error" class="error">{{ store.error }}</p>

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
      <label for="categoryId">Categoria</label>
      <select id="categoryId" v-model="categoryId" required>
        <option value="" disabled>Selecione uma categoria</option>
        <option
          v-for="category in categoryStore.categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
    </div>
    <div class="field">
      <label for="ownerId">Titular</label>
      <select id="ownerId" v-model="ownerId" required>
        <option value="" disabled>Selecione um titular</option>
        <option v-for="owner in ownerStore.owners" :key="owner.id" :value="owner.id">
          {{ owner.name }}
        </option>
      </select>
    </div>
    <div class="field">
      <label for="value">Valor</label>
      <input id="value" v-model.number="value" type="number" step="0.01" min="0.01" required />
    </div>
    <div class="field">
      <label for="dueDateDay">Dia de Vencimento</label>
      <input id="dueDateDay" v-model.number="dueDateDay" type="number" min="1" max="31" />
    </div>
    <div class="field">
      <label for="website">Website</label>
      <input id="website" v-model="website" type="text" />
    </div>
    <div class="field">
      <label for="websiteUsername">Usuario do Website</label>
      <input id="websiteUsername" v-model="websiteUsername" type="text" />
    </div>
    <div class="field">
      <label for="websitePassword">Senha do Website</label>
      <input id="websitePassword" v-model="websitePassword" type="text" />
    </div>
    <div class="actions">
      <button type="submit">Salvar</button>
      <RouterLink to="/payment-templates">Cancelar</RouterLink>
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

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}
</style>
