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

const now = new Date()
const filterYear = ref(now.getFullYear())
const filterMonth = ref(now.getMonth())

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

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

const filteredBatches = computed(() =>
  [...batchStore.batches]
    .filter(
      (b) =>
        b.date.getFullYear() === filterYear.value && b.date.getMonth() === filterMonth.value,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime()),
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
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Lotes de Pagamento</h1>
    <div class="flex gap-3 items-center">
      <div class="flex items-center gap-1.5">
        <label for="batchMonth" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Mes</label>
        <select id="batchMonth" v-model.number="filterMonth" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">{{ name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label for="batchYear" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Ano</label>
        <select id="batchYear" v-model.number="filterYear" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
            {{ now.getFullYear() - 3 + y }}
          </option>
        </select>
      </div>
    </div>
  </div>

  <p v-if="batchStore.error" class="error">{{ batchStore.error }}</p>

  <div v-if="filteredBatches.length" class="flex flex-col gap-4 mt-5">
    <div
      v-for="batch in filteredBatches"
      :key="batch.id"
      class="bg-surface border border-border rounded-lg overflow-hidden"
    >
      <header
        class="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none transition-colors duration-[120ms] hover:bg-surface-hover"
        @click="toggleExpand(batch.id)"
      >
        <div class="flex items-center gap-2.5">
          <h2 class="text-[0.9375rem] font-semibold !mb-0 !tracking-normal">{{ batch.name }}</h2>
          <span class="text-xs font-semibold text-text-muted bg-white/[0.06] px-2 py-0.5 rounded-full">
            {{ batch.paymentIds.length }} pagamento(s)
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[0.8125rem] text-text-muted">{{ formatDate(batch.date) }}</span>
          <span class="text-sm font-semibold text-text-secondary">
            {{ formatCurrency(batchTotal(batch.paymentIds)) }}
          </span>
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
            class="text-xs text-text-muted transition-transform duration-200"
            :class="expandedBatchId === batch.id ? 'rotate-0' : '-rotate-90'"
          >
            &#9662;
          </span>
        </div>
      </header>

      <div v-show="expandedBatchId === batch.id">
        <table class="!mt-0 !border-0 !rounded-none border-t border-t-border">
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
              <td colspan="4" class="text-center text-text-muted p-4">
                Nenhum pagamento encontrado
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="transactionBatchId === batch.id" class="p-4 px-5 border-t border-border bg-bg-subtle">
          <h3 class="text-sm font-semibold mb-3">Criar transacao a partir do lote</h3>
          <div class="flex items-end gap-4 flex-wrap">
            <div class="form-group !mb-0 flex-1 min-w-[140px]">
              <label>Valor</label>
              <input type="text" :value="formatCurrency(batchTotal(batch.paymentIds))" disabled />
            </div>
            <div class="form-group !mb-0 flex-1 min-w-[140px]">
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
            <div class="form-group !mb-0 flex-1 min-w-[140px]">
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
            <div class="flex gap-2 shrink-0">
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
