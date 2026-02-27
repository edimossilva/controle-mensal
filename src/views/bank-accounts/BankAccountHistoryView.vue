<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBankAccountHistoryStore } from '@/stores/bank-account-history-store'
import { useBankAccountStore } from '@/stores/bank-account-store'

const route = useRoute()
const store = useBankAccountHistoryStore()
const bankAccountStore = useBankAccountStore()

const accountId = route.params.id as string
const account = bankAccountStore.getById(accountId)

const TYPE_LABELS: Record<string, string> = {
  transaction: 'Transacao',
  payment: 'Pagamento',
}

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

onMounted(() => {
  bankAccountStore.loadAll()
  store.loadByAccountId(accountId)
})
</script>

<template>
  <h1>Historico — {{ account?.name ?? 'Conta' }}</h1>
  <RouterLink to="/bank-accounts" class="btn">Voltar</RouterLink>

  <table v-if="store.entries.length">
    <thead>
      <tr>
        <th>Data</th>
        <th>Tipo</th>
        <th>Descricao</th>
        <th>Efeito</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in store.entries" :key="entry.id">
        <td>{{ formatDate(entry.date) }}</td>
        <td>{{ typeLabel(entry.type) }}</td>
        <td>{{ entry.description }}</td>
        <td :class="entry.amount >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(entry.amount) }}
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhum registro encontrado.</p>
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

.positive {
  color: #27ae60;
}

.negative {
  color: #e74c3c;
}
</style>
