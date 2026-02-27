<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

onMounted(() => {
  store.loadAll()
  templateStore.loadAll()
  bankAccountStore.loadAll()
  ownerStore.loadAll()
})

function templateName(templateId: string): string {
  return templateStore.getById(templateId)?.name ?? 'Desconhecido'
}

function accountName(accountId: string): string {
  return bankAccountStore.getById(accountId)?.name ?? 'Desconhecida'
}

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  skipped: 'Ignorado',
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
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
  <div class="page-header">
    <h1>Pagamentos</h1>
    <RouterLink to="/payments/new" class="btn">Novo Pagamento</RouterLink>
  </div>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <table v-if="store.payments.length">
    <thead>
      <tr>
        <th>Modelo</th>
        <th>Titular</th>
        <th>Conta</th>
        <th>Valor</th>
        <th>Data Pagamento</th>
        <th>Status</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="payment in store.payments" :key="payment.id">
        <td>{{ templateName(payment.templateId) }}</td>
        <td>{{ ownerName(payment.ownerId) }}</td>
        <td>{{ accountName(payment.bankAccountId) }}</td>
        <td>{{ formatCurrency(payment.value) }}</td>
        <td>{{ formatDate(payment.paymentDate) }}</td>
        <td>{{ statusLabel(payment.status) }}</td>
        <td>
          <div class="actions">
            <RouterLink :to="`/payments/${payment.id}/edit`" class="btn-link">Editar</RouterLink>
            <button type="button" class="btn-link danger" @click="confirmDelete(payment.id)">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else>Nenhum pagamento cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>
