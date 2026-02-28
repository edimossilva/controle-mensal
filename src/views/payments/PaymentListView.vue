<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef } from 'vue'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { PaymentStatus } from '@/entities/payment'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const categoryStore = usePaymentCategoryStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()
const showGenerateSection = ref(false)

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

const STATUS_ORDER: PaymentStatus[] = ['pending', 'skipped', 'paid']

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  skipped: 'Ignorado',
}

const expandedGroups = reactive<Record<PaymentStatus, boolean>>({
  pending: true,
  skipped: true,
  paid: false,
})

function toggleGroup(status: PaymentStatus) {
  expandedGroups[status] = !expandedGroups[status]
}

function templateName(templateId?: string): string {
  if (!templateId) return '—'
  return templateStore.getById(templateId)?.name ?? 'Desconhecido'
}

function accountName(accountId: string): string {
  return bankAccountStore.getById(accountId)?.name ?? 'Desconhecida'
}

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function categoryName(categoryId: string): string {
  return categoryStore.getById(categoryId)?.name ?? 'Sem categoria'
}

function categoryColor(categoryId: string): string {
  return categoryStore.getById(categoryId)?.color ?? '#888'
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

const { sortedItems, sortBy, sortClass } = useSortable(toRef(store, 'payments'), {
  template: (p) => templateName(p.templateId).toLowerCase(),
  category: (p) => categoryName(p.categoryId).toLowerCase(),
  owner: (p) => ownerName(p.ownerId).toLowerCase(),
  account: (p) => accountName(p.bankAccountId).toLowerCase(),
  value: (p) => p.value,
  date: (p) => p.paymentDate,
  status: (p) => p.status,
})

const groupedPayments = computed(() => {
  const groups = new Map<PaymentStatus, typeof sortedItems.value>()
  for (const status of STATUS_ORDER) {
    const items = sortedItems.value.filter((p) => p.status === status)
    if (items.length > 0) {
      groups.set(status, items)
    }
  }
  return groups
})

function groupTotal(payments: typeof sortedItems.value): number {
  return payments.reduce((sum, p) => sum + p.value, 0)
}

onMounted(() => {
  store.loadAll()
  templateStore.loadAll()
  bankAccountStore.loadAll()
  ownerStore.loadAll()
  categoryStore.loadAll()
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
    <div class="header-actions">
      <button type="button" class="btn btn-secondary" @click="showGenerateSection = !showGenerateSection">
        {{ showGenerateSection ? 'Fechar gerador' : 'Gerar a partir dos modelos' }}
      </button>
      <RouterLink to="/payments/new" class="btn">Novo Pagamento</RouterLink>
    </div>
  </div>

  <section v-if="showGenerateSection" class="generate-section">
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

  <div v-if="store.payments.length" class="status-groups">
    <section
      v-for="[status, payments] in groupedPayments"
      :key="status"
      class="status-card"
      :class="`status-card--${status}`"
    >
      <header class="status-card__header" @click="toggleGroup(status)">
        <div class="status-card__title">
          <span class="status-card__indicator" :class="`indicator--${status}`" />
          <h2>{{ STATUS_LABELS[status] }}</h2>
          <span class="status-card__count">{{ payments.length }}</span>
        </div>
        <div class="status-card__summary">
          <span class="status-card__total">{{ formatCurrency(groupTotal(payments)) }}</span>
          <span class="status-card__chevron" :class="{ 'chevron--open': expandedGroups[status] }">
            &#9662;
          </span>
        </div>
      </header>

      <div v-show="expandedGroups[status]" class="status-card__body">
        <table>
          <thead>
            <tr>
              <th :class="sortClass('template')" @click="sortBy('template')">Modelo</th>
              <th :class="sortClass('category')" @click="sortBy('category')">Categoria</th>
              <th :class="sortClass('owner')" @click="sortBy('owner')">Titular</th>
              <th :class="sortClass('account')" @click="sortBy('account')">Conta</th>
              <th :class="sortClass('value')" @click="sortBy('value')">Valor</th>
              <th :class="sortClass('date')" @click="sortBy('date')">Data Pagamento</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id">
              <td>{{ templateName(payment.templateId) }}</td>
              <td>
                <span
                  class="category-badge"
                  :style="{ backgroundColor: categoryColor(payment.categoryId) }"
                >
                  {{ categoryName(payment.categoryId) }}
                </span>
              </td>
              <td>{{ ownerName(payment.ownerId) }}</td>
              <td>{{ accountName(payment.bankAccountId) }}</td>
              <td>{{ formatCurrency(payment.value) }}</td>
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>
                <div class="actions">
                  <RouterLink :to="`/payments/${payment.id}/edit`" class="btn-link">
                    Editar
                  </RouterLink>
                  <button
                    type="button"
                    class="btn-link danger"
                    @click="confirmDelete(payment.id)"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  <p v-else-if="!store.error">Nenhum pagamento cadastrado.</p>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
}

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

/* ── Status groups ───────────────────────────────────────────── */
.status-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.25rem;
}

.status-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.status-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.status-card__header:hover {
  background: var(--color-surface-hover);
}

.status-card__title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.status-card__title h2 {
  font-size: 0.9375rem;
  font-weight: 600;
}

.status-card__indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.indicator--pending {
  background: var(--color-warning);
}

.indicator--paid {
  background: var(--color-success);
}

.indicator--skipped {
  background: var(--color-text-muted);
}

.status-card__count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.status-card__summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-card__total {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.status-card__chevron {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: transform var(--transition-base);
  transform: rotate(-90deg);
}

.chevron--open {
  transform: rotate(0deg);
}

.status-card__body table {
  margin-top: 0;
  border: none;
  border-radius: 0;
  border-top: 1px solid var(--color-border);
}

.category-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}
</style>
