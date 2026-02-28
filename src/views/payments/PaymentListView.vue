<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { usePaymentBatchStore } from '@/stores/payment-batch-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Payment, PaymentStatus } from '@/entities/payment'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const categoryStore = usePaymentCategoryStore()
const batchStore = usePaymentBatchStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()
const showGenerateSection = ref(false)

const selectedPaymentIds = reactive(new Set<string>())
const showBatchForm = ref(false)
const batchName = ref('')
const batchDate = ref(new Date().toISOString().slice(0, 10))
const batchError = ref<string | null>(null)

const editingPaymentId = ref<string | null>(null)
const editValue = ref(0)
const editDate = ref('')
const editStatus = ref<PaymentStatus>('pending')
const editCategoryId = ref('')
const editBankAccountId = ref('')
const editNotes = ref('')

const now = new Date()
const filterMonth = ref(now.getMonth())
const filterYear = ref(now.getFullYear())

const showMoveSection = ref(false)
const moveTargetMonth = ref(now.getMonth())
const moveTargetYear = ref(now.getFullYear())
const moveResult = ref<{ moved: number } | null>(null)

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

const filteredPayments = computed(() =>
  store.payments.filter(
    (p) =>
      p.paymentDate.getFullYear() === filterYear.value &&
      p.paymentDate.getMonth() === filterMonth.value,
  ),
)

const { sortedItems, sortBy, sortClass } = useSortable(filteredPayments, {
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

function startEdit(payment: Payment) {
  editingPaymentId.value = payment.id
  editValue.value = payment.value
  editDate.value = payment.paymentDate.toISOString().slice(0, 10)
  editStatus.value = payment.status
  editCategoryId.value = payment.categoryId
  editBankAccountId.value = payment.bankAccountId
  editNotes.value = payment.notes ?? ''
}

function cancelEdit() {
  editingPaymentId.value = null
}

function saveEdit() {
  if (!editingPaymentId.value) return
  const existing = store.getById(editingPaymentId.value)
  if (!existing) return

  store.update({
    ...existing,
    value: editValue.value,
    paymentDate: new Date(editDate.value + 'T00:00:00'),
    status: editStatus.value,
    categoryId: editCategoryId.value,
    bankAccountId: editBankAccountId.value,
    notes: editNotes.value || undefined,
  })

  if (!store.error) {
    editingPaymentId.value = null
    bankAccountStore.loadAll()
  }
}

function handleMovePayments() {
  moveResult.value = null
  const payments = filteredPayments.value
  if (payments.length === 0) return

  let moved = 0
  for (const payment of payments) {
    const oldDate = payment.paymentDate
    const day = oldDate.getDate()
    const lastDay = new Date(moveTargetYear.value, moveTargetMonth.value + 1, 0).getDate()
    const newDay = Math.min(day, lastDay)
    const newDate = new Date(moveTargetYear.value, moveTargetMonth.value, newDay)

    store.update({
      ...payment,
      paymentDate: newDate,
    })
    if (!store.error) moved++
  }

  moveResult.value = { moved }
  store.loadAll()
  bankAccountStore.loadAll()
  filterMonth.value = moveTargetMonth.value
  filterYear.value = moveTargetYear.value
  showMoveSection.value = false
}

function togglePaymentSelection(id: string) {
  if (selectedPaymentIds.has(id)) {
    selectedPaymentIds.delete(id)
  } else {
    selectedPaymentIds.add(id)
  }
}

const pendingPayments = computed(() => groupedPayments.value.get('pending') ?? [])

const allPendingSelected = computed(
  () => pendingPayments.value.length > 0 && pendingPayments.value.every((p) => selectedPaymentIds.has(p.id)),
)

function toggleSelectAllPending() {
  if (allPendingSelected.value) {
    for (const p of pendingPayments.value) {
      selectedPaymentIds.delete(p.id)
    }
  } else {
    for (const p of pendingPayments.value) {
      selectedPaymentIds.add(p.id)
    }
  }
}

const selectedTotal = computed(() => {
  let total = 0
  for (const id of selectedPaymentIds) {
    const payment = store.payments.find((p) => p.id === id)
    if (payment) total += payment.value
  }
  return total
})

function handleCreateBatch() {
  batchError.value = null
  if (!batchName.value.trim()) {
    batchError.value = 'Informe o nome do lote.'
    return
  }
  const success = batchStore.create({
    name: batchName.value.trim(),
    date: new Date(batchDate.value + 'T12:00:00'),
    paymentIds: [...selectedPaymentIds],
  })
  if (success) {
    selectedPaymentIds.clear()
    showBatchForm.value = false
    batchName.value = ''
    batchDate.value = new Date().toISOString().slice(0, 10)
    store.loadAll()
    bankAccountStore.loadAll()
  } else {
    batchError.value = batchStore.error
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

  <div class="filter-bar">
    <div class="filter-group">
      <label for="filterMonth">Mes</label>
      <select id="filterMonth" v-model.number="filterMonth">
        <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
          {{ name }}
        </option>
      </select>
    </div>
    <div class="filter-group">
      <label for="filterYear">Ano</label>
      <select id="filterYear" v-model.number="filterYear">
        <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
          {{ now.getFullYear() - 3 + y }}
        </option>
      </select>
    </div>
    <button
      v-if="filteredPayments.length > 0"
      type="button"
      class="btn btn-secondary btn-sm"
      @click="showMoveSection = !showMoveSection"
    >
      {{ showMoveSection ? 'Cancelar' : 'Mover todos' }}
    </button>
  </div>

  <section v-if="showMoveSection" class="move-section">
    <h2>Mover todos os pagamentos de {{ MONTH_NAMES[filterMonth] }} {{ filterYear }}</h2>
    <div class="move-fields">
      <div class="filter-group">
        <label for="moveMonth">Para mes</label>
        <select id="moveMonth" v-model.number="moveTargetMonth">
          <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label for="moveYear">Para ano</label>
        <select id="moveYear" v-model.number="moveTargetYear">
          <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
            {{ now.getFullYear() - 3 + y }}
          </option>
        </select>
      </div>
      <button type="button" class="btn" @click="handleMovePayments">Confirmar</button>
    </div>
    <div v-if="moveResult" class="move-result">
      {{ moveResult.moved }} pagamento(s) movido(s).
    </div>
  </section>

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

  <div v-if="filteredPayments.length" class="status-groups">
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
              <th v-if="status === 'pending'" class="col-checkbox">
                <input
                  type="checkbox"
                  :checked="allPendingSelected"
                  @change="toggleSelectAllPending"
                />
              </th>
              <th :class="sortClass('template')" @click="sortBy('template')">Modelo</th>
              <th :class="sortClass('category')" @click="sortBy('category')">Categoria</th>
              <th :class="sortClass('owner')" @click="sortBy('owner')">Titular</th>
              <th :class="sortClass('account')" @click="sortBy('account')">Conta</th>
              <th :class="sortClass('value')" @click="sortBy('value')">Valor</th>
              <th :class="sortClass('date')" @click="sortBy('date')">Data Pagamento</th>
              <th :class="sortClass('status')" @click="sortBy('status')">Status</th>
              <th>Obs.</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id" @keydown.esc="cancelEdit" @keydown.enter="saveEdit">
              <template v-if="editingPaymentId === payment.id">
                <td v-if="status === 'pending'" class="col-checkbox" />
                <td>{{ templateName(payment.templateId) }}</td>
                <td>
                  <select v-model="editCategoryId" class="inline-input">
                    <option
                      v-for="cat in categoryStore.categories"
                      :key="cat.id"
                      :value="cat.id"
                    >
                      {{ cat.name }}
                    </option>
                  </select>
                </td>
                <td>{{ ownerName(payment.ownerId) }}</td>
                <td>
                  <select v-model="editBankAccountId" class="inline-input">
                    <option
                      v-for="account in bankAccountStore.accounts"
                      :key="account.id"
                      :value="account.id"
                    >
                      {{ account.name }}
                    </option>
                  </select>
                </td>
                <td>
                  <input
                    v-model.number="editValue"
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="inline-input inline-input--number"
                  />
                </td>
                <td>
                  <input v-model="editDate" type="date" class="inline-input" />
                </td>
                <td>
                  <select v-model="editStatus" class="inline-input">
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="skipped">Ignorado</option>
                  </select>
                </td>
                <td>
                  <input
                    v-model="editNotes"
                    type="text"
                    placeholder="Obs."
                    class="inline-input"
                  />
                </td>
                <td>
                  <div class="actions">
                    <button type="button" class="btn-link" @click="saveEdit">Salvar</button>
                    <button type="button" class="btn-link danger" @click="cancelEdit">
                      Cancelar
                    </button>
                  </div>
                </td>
              </template>
              <template v-else>
                <td v-if="status === 'pending'" class="col-checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedPaymentIds.has(payment.id)"
                    @change="togglePaymentSelection(payment.id)"
                  />
                </td>
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
                <td>{{ STATUS_LABELS[payment.status] }}</td>
                <td>{{ payment.notes ?? '—' }}</td>
                <td>
                  <div class="actions">
                    <button type="button" class="btn-link" @click="startEdit(payment)">
                      Editar
                    </button>
                    <button
                      type="button"
                      class="btn-link danger"
                      @click="confirmDelete(payment.id)"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  <p v-else-if="!store.error">
    Nenhum pagamento em {{ MONTH_NAMES[filterMonth] }} {{ filterYear }}.
  </p>

  <div v-if="selectedPaymentIds.size > 0" class="batch-bar">
    <div class="batch-bar__info">
      <strong>{{ selectedPaymentIds.size }}</strong> pagamento(s) selecionado(s)
      &mdash; Total: <strong>{{ formatCurrency(selectedTotal) }}</strong>
    </div>
    <div v-if="!showBatchForm" class="batch-bar__actions">
      <button type="button" class="btn" @click="showBatchForm = true">Criar lote</button>
      <button type="button" class="btn btn-secondary" @click="selectedPaymentIds.clear()">
        Limpar
      </button>
    </div>
    <form v-else class="batch-form" @submit.prevent="handleCreateBatch">
      <input
        v-model="batchName"
        type="text"
        placeholder="Nome do lote"
        class="batch-form__input"
        required
      />
      <input v-model="batchDate" type="date" class="batch-form__input" required />
      <button type="submit" class="btn">Confirmar</button>
      <button type="button" class="btn btn-secondary" @click="showBatchForm = false">
        Cancelar
      </button>
      <span v-if="batchError" class="error">{{ batchError }}</span>
    </form>
  </div>

  <ConfirmDialog ref="confirmDialog" @confirm="handleDelete" />
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.filter-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.filter-group select {
  padding: 0.3rem 0.5rem;
  font-size: 0.8125rem;
}

.btn-sm {
  padding: 0.3rem 0.625rem;
  font-size: 0.8125rem;
  height: auto;
}

.move-section {
  margin-top: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.move-section h2 {
  font-size: 0.9375rem;
  margin-bottom: 0.75rem;
}

.move-fields {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.move-result {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-success-dim);
  color: var(--color-success);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

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

/* ── Inline editing ──────────────────────────────────────────── */
.inline-input {
  width: 100%;
  min-width: 80px;
  padding: 0.25rem 0.375rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
}

.inline-input--number {
  max-width: 100px;
}

/* ── Checkbox column ─────────────────────────────────────────── */
.col-checkbox {
  width: 2.5rem;
  text-align: center;
}

/* ── Batch action bar ────────────────────────────────────────── */
.batch-bar {
  position: sticky;
  bottom: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1.25rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
}

.batch-bar__info {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.batch-bar__actions {
  display: flex;
  gap: 0.5rem;
}

.batch-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.batch-form__input {
  padding: 0.375rem 0.625rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
}
</style>
