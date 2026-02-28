<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useBankAccountStore()
const ownerStore = useOwnerStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'accounts'), {
  name: (a) => a.name.toLowerCase(),
  owner: (a) => ownerName(a.ownerId).toLowerCase(),
  initialBalance: (a) => a.initialBalance,
  currentBalance: (a) => a.currentBalance,
})

onMounted(() => {
  store.loadAll()
  ownerStore.loadAll()
})

function confirmDelete(id: string) {
  pendingDeleteId.value = id
  confirmDialog.value?.open()
}

function handleDelete() {
  if (pendingDeleteId.value) {
    store.remove(pendingDeleteId.value)
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Contas Bancarias</h1>
    <RouterLink to="/bank-accounts/new" class="btn">Nova Conta</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.accounts.length">
    <thead>
      <tr>
        <th :class="sortClass('name')" @click="sortBy('name')">Nome</th>
        <th :class="sortClass('owner')" @click="sortBy('owner')">Titular</th>
        <th :class="sortClass('initialBalance')" @click="sortBy('initialBalance')">
          Saldo Inicial
        </th>
        <th :class="sortClass('currentBalance')" @click="sortBy('currentBalance')">
          Saldo Atual
        </th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="account in sortedItems" :key="account.id">
        <td>{{ account.name }}</td>
        <td>{{ ownerName(account.ownerId) }}</td>
        <td>{{ formatCurrency(account.initialBalance) }}</td>
        <td>{{ formatCurrency(account.currentBalance) }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/bank-accounts/${account.id}/history`" class="btn-link">
              Historico
            </RouterLink>
            <RouterLink :to="`/bank-accounts/${account.id}/edit`" class="btn-link">
              Editar
            </RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(account.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma conta cadastrada.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
