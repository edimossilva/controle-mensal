<script setup lang="ts">
import { onMounted, toRef } from 'vue'
import { useRoute } from 'vue-router'
import { useBankAccountHistoryStore } from '@/stores/bank-account-history-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useSortable } from '@/composables/use-sortable'

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

function accountName(accountId?: string): string {
  if (!accountId) return '-'
  return bankAccountStore.getById(accountId)?.name ?? 'Desconhecida'
}

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'entries'), {
  date: (e) => e.date,
  type: (e) => e.type,
  description: (e) => e.description.toLowerCase(),
  target: (e) => accountName(e.targetAccountId).toLowerCase(),
  amount: (e) => e.amount,
})

onMounted(() => {
  bankAccountStore.loadAll()
  store.loadByAccountId(accountId)
})
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Historico — {{ account?.name ?? 'Conta' }}</h1>
    <RouterLink to="/bank-accounts" class="btn btn-secondary">Voltar</RouterLink>
  </div>

  <table v-if="store.entries.length">
    <thead>
      <tr>
        <th :class="sortClass('date')" @click="sortBy('date')">Data</th>
        <th :class="sortClass('type')" @click="sortBy('type')">Tipo</th>
        <th :class="sortClass('description')" @click="sortBy('description')">Descricao</th>
        <th :class="sortClass('target')" @click="sortBy('target')">Conta Destino</th>
        <th :class="sortClass('amount')" @click="sortBy('amount')">Efeito</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in sortedItems" :key="entry.id">
        <td>{{ formatDate(entry.date) }}</td>
        <td>{{ typeLabel(entry.type) }}</td>
        <td>{{ entry.description }}</td>
        <td>{{ accountName(entry.targetAccountId) }}</td>
        <td :class="entry.amount >= 0 ? 'positive' : 'negative'">
          {{ formatCurrency(entry.amount) }}
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhum registro encontrado.</p>
</template>
