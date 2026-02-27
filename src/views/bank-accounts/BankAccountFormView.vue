<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { useEntityForm } from '@/composables/use-entity-form'

const store = useBankAccountStore()
const ownerStore = useOwnerStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const name = ref('')
const initialBalance = ref(0)
const currentBalance = ref(0)
const ownerId = ref('')

onMounted(() => ownerStore.loadAll())

watch(existing, (entity) => {
  if (entity) {
    name.value = entity.name
    initialBalance.value = entity.initialBalance
    currentBalance.value = entity.currentBalance
    ownerId.value = entity.ownerId
  }
})

function handleSubmit() {
  if (isEditMode.value && existing.value) {
    store.update({
      ...existing.value,
      name: name.value,
      initialBalance: initialBalance.value,
      currentBalance: currentBalance.value,
      ownerId: ownerId.value,
    })
  } else {
    store.create(name.value, initialBalance.value, ownerId.value)
  }

  if (store.error) return
  router.push('/bank-accounts')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Conta' : 'Nova Conta' }}</h1>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <form @submit.prevent="handleSubmit">
    <div class="field">
      <label for="name">Nome</label>
      <input id="name" v-model="name" type="text" required />
    </div>
    <div class="field">
      <label for="initialBalance">Saldo Inicial</label>
      <input
        id="initialBalance"
        v-model.number="initialBalance"
        type="number"
        step="0.01"
        required
      />
    </div>
    <div v-if="isEditMode" class="field">
      <label for="currentBalance">Saldo Atual</label>
      <input
        id="currentBalance"
        v-model.number="currentBalance"
        type="number"
        step="0.01"
        required
      />
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
    <div class="actions">
      <button type="submit">Salvar</button>
      <RouterLink to="/bank-accounts">Cancelar</RouterLink>
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
