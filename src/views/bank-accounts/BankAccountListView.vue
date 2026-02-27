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
  <h1>Contas Bancárias</h1>
  <RouterLink to="/bank-accounts/new" class="btn">Nova Conta</RouterLink>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.accounts.length">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Titular</th>
        <th>Saldo Inicial</th>
        <th>Saldo Atual</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="account in store.accounts" :key="account.id">
        <td>{{ account.name }}</td>
        <td>{{ ownerName(account.ownerId) }}</td>
        <td>{{ formatCurrency(account.initialBalance) }}</td>
        <td>{{ formatCurrency(account.currentBalance) }}</td>
        <td>
          <RouterLink :to="`/bank-accounts/${account.id}/history`">Historico</RouterLink>
          <RouterLink :to="`/bank-accounts/${account.id}/edit`">Editar</RouterLink>
          <button type="button" class="btn-link danger" @click="confirmDelete(account.id)">
            Excluir
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhuma conta cadastrada.</p>

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
