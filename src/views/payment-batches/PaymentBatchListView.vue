<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePaymentBatchStore } from '@/stores/payment-batch-store'
import { usePaymentStore } from '@/stores/payment-store'
import { useTransactionStore } from '@/stores/transaction-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const batchStore = usePaymentBatchStore()
const paymentStore = usePaymentStore()
const transactionStore = useTransactionStore()
const bankAccountStore = useBankAccountStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()
const expandedBatchId = ref<string | null>(null)

const transactionBatchId = ref<string | null>(null)
const txOriginAccountId = ref('')
const txDestinationAccountId = ref('')
const txError = ref<string | null>(null)

onMounted(() => {
  batchStore.loadAll()
  paymentStore.loadAll()
  bankAccountStore.loadAll()
})

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function batchPayments(paymentIds: string[]) {
  return paymentIds
    .map((id) => paymentStore.getById(id))
    .filter((p) => p !== undefined)
}

function batchTotal(paymentIds: string[]): number {
  return batchPayments(paymentIds).reduce((sum, p) => sum + p.value, 0)
}

const sortedBatches = computed(() =>
  [...batchStore.batches].sort((a, b) => b.date.getTime() - a.date.getTime()),
)

function toggleExpand(id: string) {
  expandedBatchId.value = expandedBatchId.value === id ? null : id
}

function confirmDelete(id: string) {
  pendingDeleteId.value = id
  confirmDialog.value?.open()
}

function handleDelete() {
  if (pendingDeleteId.value) {
    batchStore.remove(pendingDeleteId.value)
  }
}

function openTransactionForm(batchId: string) {
  transactionBatchId.value = batchId
  txOriginAccountId.value = ''
  txDestinationAccountId.value = ''
  txError.value = null
}

function cancelTransaction() {
  transactionBatchId.value = null
}

function handleCreateTransaction(batchId: string) {
  txError.value = null
  const batch = batchStore.getById(batchId)
  if (!batch) return

  if (!txOriginAccountId.value || !txDestinationAccountId.value) {
    txError.value = 'Selecione as contas de origem e destino.'
    return
  }
  if (txOriginAccountId.value === txDestinationAccountId.value) {
    txError.value = 'Contas de origem e destino devem ser diferentes.'
    return
  }

  const amount = batchTotal(batch.paymentIds)
  const success = transactionStore.create({
    name: batch.name,
    description: `Lote: ${batch.name} (${batch.paymentIds.length} pagamentos)`,
    amount,
    originAccountId: txOriginAccountId.value,
    destinationAccountId: txDestinationAccountId.value,
    date: batch.date,
  })

  if (success) {
    transactionBatchId.value = null
    bankAccountStore.loadAll()
  } else {
    txError.value = transactionStore.error
  }
}
</script>

<template>
  <div class="page-header">
    <h1>Lotes de Pagamento</h1>
  </div>

  <p v-if="batchStore.error" class="error">{{ batchStore.error }}</p>

  <div v-if="sortedBatches.length" class="batch-list">
    <div v-for="batch in sortedBatches" :key="batch.id" class="batch-card">
      <header class="batch-card__header" @click="toggleExpand(batch.id)">
        <div class="batch-card__title">
          <h2>{{ batch.name }}</h2>
          <span class="batch-card__count">{{ batch.paymentIds.length }} pagamento(s)</span>
        </div>
        <div class="batch-card__summary">
          <span class="batch-card__date">{{ formatDate(batch.date) }}</span>
          <span class="batch-card__total">{{ formatCurrency(batchTotal(batch.paymentIds)) }}</span>
          <button
            type="button"
            class="btn-link"
            @click.stop="openTransactionForm(batch.id)"
          >
            Criar transacao
          </button>
          <button
            type="button"
            class="btn-link danger"
            @click.stop="confirmDelete(batch.id)"
          >
            Excluir
          </button>
          <span
            class="batch-card__chevron"
            :class="{ 'chevron--open': expandedBatchId === batch.id }"
          >
            &#9662;
          </span>
        </div>
      </header>

      <div v-show="expandedBatchId === batch.id" class="batch-card__body">
        <table>
          <thead>
            <tr>
              <th>Modelo / Nome</th>
              <th>Valor</th>
              <th>Data Pagamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in batchPayments(batch.paymentIds)" :key="payment.id">
              <td>{{ payment.templateId ?? payment.id.slice(0, 8) }}</td>
              <td>{{ formatCurrency(payment.value) }}</td>
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>{{ payment.status }}</td>
            </tr>
            <tr v-if="batchPayments(batch.paymentIds).length === 0">
              <td colspan="4" class="empty-row">Nenhum pagamento encontrado</td>
            </tr>
          </tbody>
        </table>

        <div v-if="transactionBatchId === batch.id" class="transaction-form">
          <h3>Criar transacao a partir do lote</h3>
          <div class="transaction-form__fields">
            <div class="form-group">
              <label>Valor</label>
              <input type="text" :value="formatCurrency(batchTotal(batch.paymentIds))" disabled />
            </div>
            <div class="form-group">
              <label>Conta de origem</label>
              <select v-model="txOriginAccountId" required>
                <option value="" disabled>Selecione</option>
                <option
                  v-for="account in bankAccountStore.accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Conta de destino</label>
              <select v-model="txDestinationAccountId" required>
                <option value="" disabled>Selecione</option>
                <option
                  v-for="account in bankAccountStore.accounts"
                  :key="account.id"
                  :value="account.id"
                >
                  {{ account.name }}
                </option>
              </select>
            </div>
            <div class="transaction-form__actions">
              <button type="button" class="btn" @click="handleCreateTransaction(batch.id)">
                Confirmar
              </button>
              <button type="button" class="btn btn-secondary" @click="cancelTransaction">
                Cancelar
              </button>
            </div>
          </div>
          <p v-if="txError" class="error">{{ txError }}</p>
        </div>
      </div>
    </div>
  </div>
  <p v-else-if="!batchStore.error">Nenhum lote cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
.batch-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}

.batch-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.batch-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.batch-card__header:hover {
  background: var(--color-surface-hover);
}

.batch-card__title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.batch-card__title h2 {
  font-size: 0.9375rem;
  font-weight: 600;
}

.batch-card__count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.batch-card__summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.batch-card__date {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.batch-card__total {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.batch-card__chevron {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: transform var(--transition-base);
  transform: rotate(-90deg);
}

.chevron--open {
  transform: rotate(0deg);
}

.batch-card__body table {
  margin-top: 0;
  border: none;
  border-radius: 0;
  border-top: 1px solid var(--color-border);
}

.empty-row {
  text-align: center;
  color: var(--color-text-muted);
  padding: 1rem;
}

/* ── Transaction form ────────────────────────────────────────── */
.transaction-form {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-subtle);
}

.transaction-form h3 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.transaction-form__fields {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.transaction-form__fields .form-group {
  margin-bottom: 0;
  flex: 1;
  min-width: 140px;
}

.transaction-form__actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}
</style>
