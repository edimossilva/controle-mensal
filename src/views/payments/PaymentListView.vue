<script setup lang="ts">
import { onMounted, ref, toRef } from 'vue'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()

const now = new Date()
const generateYear = ref(now.getFullYear())
const generateMonth = ref(now.getMonth())
const generateBankAccountId = ref('')
const generateResult = ref<{ created: number; skipped: number } | null>(null)

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

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

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'payments'), {
  template: (p) => templateName(p.templateId).toLowerCase(),
  owner: (p) => ownerName(p.ownerId).toLowerCase(),
  account: (p) => accountName(p.bankAccountId).toLowerCase(),
  value: (p) => p.value,
  date: (p) => p.paymentDate,
  status: (p) => p.status,
})

onMounted(() => {
  store.loadAll()
  templateStore.loadAll()
  bankAccountStore.loadAll()
  ownerStore.loadAll()
})

function handleGenerate() {
  generateResult.value = null
  const result = store.generateFromTemplates(
    generateYear.value,
    generateMonth.value,
    generateBankAccountId.value,
  )
  if (result) {
    generateResult.value = result
  }
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

  <section class="generate-section">
    <h2>Gerar pagamentos a partir dos modelos</h2>
    <form class="generate-form" @submit.prevent="handleGenerate">
      <div class="generate-fields">
        <div class="form-group">
          <label for="generateMonth">Mes</label>
          <select id="generateMonth" v-model.number="generateMonth" required>
            <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
              {{ name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="generateYear">Ano</label>
          <input
            id="generateYear"
            v-model.number="generateYear"
            type="number"
            min="2020"
            max="2099"
            required
          />
        </div>
        <div class="form-group">
          <label for="generateAccount">Conta</label>
          <select id="generateAccount" v-model="generateBankAccountId" required>
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
        <button type="submit" class="btn generate-btn">Gerar</button>
      </div>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>

    <div v-if="generateResult" class="generate-result">
      {{ generateResult.created }} pagamentos criados, {{ generateResult.skipped }} ja existentes.
    </div>
  </section>

  <table v-if="store.payments.length">
    <thead>
      <tr>
        <th :class="sortClass('template')" @click="sortBy('template')">Modelo</th>
        <th :class="sortClass('owner')" @click="sortBy('owner')">Titular</th>
        <th :class="sortClass('account')" @click="sortBy('account')">Conta</th>
        <th :class="sortClass('value')" @click="sortBy('value')">Valor</th>
        <th :class="sortClass('date')" @click="sortBy('date')">Data Pagamento</th>
        <th :class="sortClass('status')" @click="sortBy('status')">Status</th>
        <th>Acoes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="payment in sortedItems" :key="payment.id">
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
  <p v-else-if="!store.error">Nenhum pagamento cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
.generate-section {
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.generate-section h2 {
  font-size: 1rem;
  margin-bottom: 1rem;
}

.generate-fields {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.generate-fields .form-group {
  margin-bottom: 0;
  flex: 1;
  min-width: 140px;
}

.generate-btn {
  flex-shrink: 0;
  height: 2.4rem;
}

.generate-result {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-success-dim);
  color: var(--color-success);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}
</style>
