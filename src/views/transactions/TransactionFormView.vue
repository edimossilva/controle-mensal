<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transaction-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useEntityForm } from '@/composables/use-entity-form'

const store = useTransactionStore()
const bankAccountStore = useBankAccountStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const name = ref('')
const description = ref('')
const amount = ref(0)
const originAccountId = ref('')
const destinationAccountId = ref('')
const date = ref(new Date().toISOString().slice(0, 10))

onMounted(() => bankAccountStore.loadAll())

watch(existing, (entity) => {
  if (entity) {
    name.value = entity.name
    description.value = entity.description
    amount.value = entity.amount
    originAccountId.value = entity.originAccountId
    destinationAccountId.value = entity.destinationAccountId
    date.value = entity.date.toISOString().slice(0, 10)
  }
})

function handleSubmit() {
  const parsedDate = new Date(date.value + 'T00:00:00')

  if (isEditMode.value && existing.value) {
    store.update({
      ...existing.value,
      name: name.value,
      description: description.value,
      amount: amount.value,
      originAccountId: originAccountId.value,
      destinationAccountId: destinationAccountId.value,
      date: parsedDate,
    })
  } else {
    store.create({
      name: name.value,
      description: description.value,
      amount: amount.value,
      originAccountId: originAccountId.value,
      destinationAccountId: destinationAccountId.value,
      date: parsedDate,
    })
  }

  if (store.error) return
  bankAccountStore.loadAll()
  router.push('/transactions')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Transacao' : 'Nova Transacao' }}</h1>

  <p v-if="store.error" class="error">{{ store.error }}</p>

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
      <label for="amount">Valor</label>
      <input id="amount" v-model.number="amount" type="number" step="0.01" min="0.01" required />
    </div>
    <div class="form-group">
      <label for="originAccountId">Conta Origem</label>
      <select id="originAccountId" v-model="originAccountId" required>
        <option value="" disabled>Selecione a conta de origem</option>
        <option v-for="account in bankAccountStore.accounts" :key="account.id" :value="account.id">
          {{ account.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label for="destinationAccountId">Conta Destino</label>
      <select id="destinationAccountId" v-model="destinationAccountId" required>
        <option value="" disabled>Selecione a conta de destino</option>
        <option v-for="account in bankAccountStore.accounts" :key="account.id" :value="account.id">
          {{ account.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label for="date">Data</label>
      <input id="date" v-model="date" type="date" required />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn">Salvar</button>
      <RouterLink to="/transactions" class="btn btn-secondary">Cancelar</RouterLink>
    </div>
  </form>
</template>

<style scoped>
.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
