<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { usePaymentBatchStore } from '@/stores/payment-batch-store'
import type { PaymentStatus } from '@/entities/payment'

const bankAccountStore = useBankAccountStore()
const paymentStore = usePaymentStore()
const categoryStore = usePaymentCategoryStore()
const batchStore = usePaymentBatchStore()

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  skipped: 'Ignorado',
}

onMounted(() => {
  bankAccountStore.loadAll()
  paymentStore.loadAll()
  categoryStore.loadAll()
  batchStore.loadAll()
})

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Current month payments ──────────────────────────────────────
const monthPayments = computed(() =>
  paymentStore.payments.filter(
    (p) => p.paymentDate.getFullYear() === currentYear && p.paymentDate.getMonth() === currentMonth,
  ),
)

const monthPending = computed(() => monthPayments.value.filter((p) => p.status === 'pending'))
const monthPaid = computed(() => monthPayments.value.filter((p) => p.status === 'paid'))
const monthSkipped = computed(() => monthPayments.value.filter((p) => p.status === 'skipped'))

const monthTotalPending = computed(() => monthPending.value.reduce((s, p) => s + p.value, 0))
const monthTotalPaid = computed(() => monthPaid.value.reduce((s, p) => s + p.value, 0))
const monthTotalAll = computed(() => monthPayments.value.reduce((s, p) => s + p.value, 0))

const monthProgress = computed(() => {
  const total = monthPending.value.length + monthPaid.value.length + monthSkipped.value.length
  if (total === 0) return 0
  return Math.round(((monthPaid.value.length + monthSkipped.value.length) / total) * 100)
})

// ── Bank accounts ───────────────────────────────────────────────
const totalBalance = computed(() =>
  bankAccountStore.accounts.reduce((s, a) => s + a.currentBalance, 0),
)

// ── Category breakdown (current month) ──────────────────────────
const categoryBreakdown = computed(() => {
  const map = new Map<string, number>()
  for (const p of monthPayments.value) {
    map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + p.value)
  }
  return [...map.entries()]
    .map(([catId, total]) => ({
      name: categoryStore.getById(catId)?.name ?? 'Sem categoria',
      color: categoryStore.getById(catId)?.color ?? '#888',
      total,
    }))
    .sort((a, b) => b.total - a.total)
})

// ── Upcoming pending payments (next 7 days) ─────────────────────
const upcomingPayments = computed(() => {
  const today = new Date(currentYear, currentMonth, now.getDate())
  const weekAhead = new Date(today)
  weekAhead.setDate(weekAhead.getDate() + 7)

  return monthPending.value
    .filter((p) => p.paymentDate >= today && p.paymentDate <= weekAhead)
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
})

// ── Overdue payments ────────────────────────────────────────────
const overduePayments = computed(() => {
  const today = new Date(currentYear, currentMonth, now.getDate())
  return paymentStore.payments
    .filter((p) => p.status === 'pending' && p.paymentDate < today)
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
})

// ── Recent batches ──────────────────────────────────────────────
const recentBatches = computed(() =>
  [...batchStore.batches]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5),
)

function batchTotal(paymentIds: string[]): number {
  return paymentIds
    .map((id) => paymentStore.getById(id))
    .filter((p) => p !== undefined)
    .reduce((s, p) => s + p.value, 0)
}
</script>

<template>
  <div class="page-header">
    <h1>Controle Mensal</h1>
    <span class="month-label">{{ MONTH_NAMES[currentMonth] }} {{ currentYear }}</span>
  </div>

  <!-- ── Summary cards ──────────────────────────────────────────── -->
  <div class="card-grid">
    <div class="card card--balance">
      <p>Saldo total</p>
      <h2>{{ formatCurrency(totalBalance) }}</h2>
    </div>
    <div class="card card--paid">
      <p>Pago este mes</p>
      <h2>{{ formatCurrency(monthTotalPaid) }}</h2>
      <span class="card__detail">{{ monthPaid.length }} pagamento(s)</span>
    </div>
    <div class="card card--pending">
      <p>Pendente este mes</p>
      <h2>{{ formatCurrency(monthTotalPending) }}</h2>
      <span class="card__detail">{{ monthPending.length }} pagamento(s)</span>
    </div>
    <div class="card">
      <p>Total do mes</p>
      <h2>{{ formatCurrency(monthTotalAll) }}</h2>
      <span class="card__detail">{{ monthPayments.length }} pagamento(s)</span>
    </div>
  </div>

  <!-- ── Progress bar ───────────────────────────────────────────── -->
  <section v-if="monthPayments.length > 0" class="dashboard-section">
    <h2>Progresso do mes</h2>
    <div class="progress-bar">
      <div class="progress-bar__fill" :style="{ width: monthProgress + '%' }" />
    </div>
    <div class="progress-bar__labels">
      <span>{{ monthProgress }}% concluido</span>
      <span>
        {{ monthPaid.length + monthSkipped.length }} / {{ monthPayments.length }} resolvidos
      </span>
    </div>
  </section>

  <!-- ── Bank accounts ──────────────────────────────────────────── -->
  <section v-if="bankAccountStore.accounts.length > 0" class="dashboard-section">
    <h2>Contas</h2>
    <div class="account-list">
      <div v-for="account in bankAccountStore.accounts" :key="account.id" class="account-item">
        <span class="account-item__name">{{ account.name }}</span>
        <span
          class="account-item__balance"
          :class="{ 'balance--negative': account.currentBalance < 0 }"
        >
          {{ formatCurrency(account.currentBalance) }}
        </span>
      </div>
    </div>
  </section>

  <!-- ── Overdue payments ───────────────────────────────────────── -->
  <section v-if="overduePayments.length > 0" class="dashboard-section dashboard-section--danger">
    <h2>Pagamentos atrasados</h2>
    <table>
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Valor</th>
          <th>Vencimento</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in overduePayments" :key="p.id">
          <td>
            <span
              class="category-badge"
              :style="{ backgroundColor: categoryStore.getById(p.categoryId)?.color ?? '#888' }"
            >
              {{ categoryStore.getById(p.categoryId)?.name ?? 'Sem categoria' }}
            </span>
          </td>
          <td>{{ formatCurrency(p.value) }}</td>
          <td>{{ p.paymentDate.toLocaleDateString('pt-BR') }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ── Upcoming payments ──────────────────────────────────────── -->
  <section v-if="upcomingPayments.length > 0" class="dashboard-section">
    <h2>Proximos 7 dias</h2>
    <table>
      <thead>
        <tr>
          <th>Categoria</th>
          <th>Valor</th>
          <th>Vencimento</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in upcomingPayments" :key="p.id">
          <td>
            <span
              class="category-badge"
              :style="{ backgroundColor: categoryStore.getById(p.categoryId)?.color ?? '#888' }"
            >
              {{ categoryStore.getById(p.categoryId)?.name ?? 'Sem categoria' }}
            </span>
          </td>
          <td>{{ formatCurrency(p.value) }}</td>
          <td>{{ p.paymentDate.toLocaleDateString('pt-BR') }}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ── Category breakdown ─────────────────────────────────────── -->
  <section v-if="categoryBreakdown.length > 0" class="dashboard-section">
    <h2>Gastos por categoria</h2>
    <div class="category-list">
      <div v-for="cat in categoryBreakdown" :key="cat.name" class="category-row">
        <div class="category-row__label">
          <span class="category-badge" :style="{ backgroundColor: cat.color }">
            {{ cat.name }}
          </span>
        </div>
        <div class="category-row__bar-wrapper">
          <div
            class="category-row__bar"
            :style="{
              width: (monthTotalAll > 0 ? (cat.total / monthTotalAll) * 100 : 0) + '%',
              backgroundColor: cat.color,
            }"
          />
        </div>
        <span class="category-row__value">{{ formatCurrency(cat.total) }}</span>
      </div>
    </div>
  </section>

  <!-- ── Monthly status breakdown ───────────────────────────────── -->
  <section v-if="monthPayments.length > 0" class="dashboard-section">
    <h2>Resumo por status</h2>
    <div class="status-summary">
      <div class="status-item">
        <span class="status-dot status-dot--pending" />
        <span class="status-item__label">{{ STATUS_LABELS.pending }}</span>
        <span class="status-item__count">{{ monthPending.length }}</span>
        <span class="status-item__value">{{ formatCurrency(monthTotalPending) }}</span>
      </div>
      <div class="status-item">
        <span class="status-dot status-dot--paid" />
        <span class="status-item__label">{{ STATUS_LABELS.paid }}</span>
        <span class="status-item__count">{{ monthPaid.length }}</span>
        <span class="status-item__value">{{ formatCurrency(monthTotalPaid) }}</span>
      </div>
      <div class="status-item">
        <span class="status-dot status-dot--skipped" />
        <span class="status-item__label">{{ STATUS_LABELS.skipped }}</span>
        <span class="status-item__count">{{ monthSkipped.length }}</span>
        <span class="status-item__value">
          {{ formatCurrency(monthSkipped.reduce((s, p) => s + p.value, 0)) }}
        </span>
      </div>
    </div>
  </section>

  <!-- ── Recent batches ─────────────────────────────────────────── -->
  <section v-if="recentBatches.length > 0" class="dashboard-section">
    <div class="section-header">
      <h2>Ultimos lotes</h2>
      <RouterLink to="/payment-batches" class="btn-link">Ver todos</RouterLink>
    </div>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Data</th>
          <th>Pagamentos</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="batch in recentBatches" :key="batch.id">
          <td>{{ batch.name }}</td>
          <td>{{ batch.date.toLocaleDateString('pt-BR') }}</td>
          <td>{{ batch.paymentIds.length }}</td>
          <td>{{ formatCurrency(batchTotal(batch.paymentIds)) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.month-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* ── Card overrides ──────────────────────────────────────────── */
.card-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card h2 {
  font-size: 1.5rem;
  word-break: break-word;
}

.card p {
  order: -1;
  margin-bottom: 0.25rem;
}

.card__detail {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.125rem;
}

.card--balance h2 {
  color: var(--color-primary);
}

.card--paid h2 {
  color: var(--color-success);
}

.card--pending h2 {
  color: var(--color-warning);
}

/* ── Dashboard sections ──────────────────────────────────────── */
.dashboard-section {
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.dashboard-section h2 {
  font-size: 0.9375rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.dashboard-section--danger {
  border-color: var(--color-danger);
  background: var(--color-danger-dim);
}

.dashboard-section--danger h2 {
  color: var(--color-danger);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h2 {
  margin-bottom: 0;
}

/* ── Progress bar ────────────────────────────────────────────── */
.progress-bar {
  height: 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

.progress-bar__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ── Account list ────────────────────────────────────────────── */
.account-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
}

.account-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.account-item__balance {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-success);
}

.balance--negative {
  color: var(--color-danger);
}

/* ── Category breakdown ──────────────────────────────────────── */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-row__label {
  min-width: 120px;
  flex-shrink: 0;
}

.category-row__bar-wrapper {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 9999px;
  overflow: hidden;
}

.category-row__bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
  min-width: 4px;
}

.category-row__value {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 90px;
  text-align: right;
}

.category-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
}

/* ── Status summary ──────────────────────────────────────────── */
.status-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-sm);
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--pending {
  background: var(--color-warning);
}

.status-dot--paid {
  background: var(--color-success);
}

.status-dot--skipped {
  background: var(--color-text-muted);
}

.status-item__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.status-item__count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.status-item__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-left: auto;
}

/* ── Tables in dashboard ─────────────────────────────────────── */
.dashboard-section table {
  margin-top: 0;
  border: none;
  border-radius: 0;
}
</style>
