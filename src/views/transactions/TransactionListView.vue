<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTransactionStore } from '@/stores/transaction-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useTransactionStore()
const bankAccountStore = useBankAccountStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

onMounted(() => {
  store.loadAll()
  bankAccountStore.loadAll()
})

function accountName(accountId: string): string {
  return bankAccountStore.getById(accountId)?.name ?? 'Desconhecida'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function confirmDelete(id: string) {
  pendingDeleteId.value = id
  confirmDialog.value?.open()
}

function handleDelete() {
  if (pendingDeleteId.value) {
    store.remove(pendingDeleteId.value)
    bankAccountStore.loadAll()
  }
}
</script>

<template>
  <h1>Transações</h1>
  <RouterLink to="/transactions/new" class="btn">Nova Transação</RouterLink>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.transactions.length">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Valor</th>
        <th>Origem</th>
        <th>Destino</th>
        <th>Data</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="transaction in store.transactions" :key="transaction.id">
        <td>{{ transaction.name }}</td>
        <td>{{ formatCurrency(transaction.amount) }}</td>
        <td>{{ accountName(transaction.originAccountId) }}</td>
        <td>{{ accountName(transaction.destinationAccountId) }}</td>
        <td>{{ formatDate(transaction.date) }}</td>
        <td>
          <RouterLink :to="`/transactions/${transaction.id}/edit`">Editar</RouterLink>
          <button type="button" class="btn-link danger" @click="confirmDelete(transaction.id)">
            Excluir
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma transação cadastrada.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #42b883;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  margin-left: 0.5rem;
}

.danger {
  color: #e74c3c;
}

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}
</style>
