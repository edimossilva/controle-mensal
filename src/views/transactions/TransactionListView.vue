<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import { useTransactionStore } from '@/stores/transaction-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useTransactionStore()
const bankAccountStore = useBankAccountStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

function accountName(accountId: string): string {
  return bankAccountStore.getById(accountId)?.name ?? 'Desconhecida'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'transactions'), {
  name: (t) => t.name.toLowerCase(),
  amount: (t) => t.amount,
  origin: (t) => accountName(t.originAccountId).toLowerCase(),
  destination: (t) => accountName(t.destinationAccountId).toLowerCase(),
  date: (t) => t.date,
})

onMounted(() => {
  store.loadAll()
  bankAccountStore.loadAll()
})

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
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Transacoes</h1>
    <RouterLink to="/transactions/new" class="btn">Nova Transacao</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.transactions.length">
    <thead>
      <tr>
        <th :class="sortClass('name')" @click="sortBy('name')">Nome</th>
        <th :class="sortClass('amount')" @click="sortBy('amount')">Valor</th>
        <th :class="sortClass('origin')" @click="sortBy('origin')">Origem</th>
        <th :class="sortClass('destination')" @click="sortBy('destination')">Destino</th>
        <th :class="sortClass('date')" @click="sortBy('date')">Data</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="transaction in sortedItems" :key="transaction.id">
        <td>{{ transaction.name }}</td>
        <td>{{ formatCurrency(transaction.amount) }}</td>
        <td>{{ accountName(transaction.originAccountId) }}</td>
        <td>{{ accountName(transaction.destinationAccountId) }}</td>
        <td>{{ formatDate(transaction.date) }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/transactions/${transaction.id}/edit`" class="btn-link">
              Editar
            </RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(transaction.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma transacao cadastrada.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
