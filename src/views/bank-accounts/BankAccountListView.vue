<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = useBankAccountStore()
const ownerStore = useOwnerStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

onMounted(() => {
  store.loadAll()
  ownerStore.loadAll()
})

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
        <th>Nome</th>
        <th>Titular</th>
        <th>Saldo Inicial</th>
        <th>Saldo Atual</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="account in store.accounts" :key="account.id">
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
