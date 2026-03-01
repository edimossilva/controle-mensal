<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
const filterYear = ref(now.getFullYear())
const filterMonth = ref(now.getMonth())

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
    (p) =>
      p.paymentDate.getFullYear() === filterYear.value &&
      p.paymentDate.getMonth() === filterMonth.value,
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAhead = new Date(today)
  weekAhead.setDate(weekAhead.getDate() + 7)

  return monthPending.value
    .filter((p) => p.paymentDate >= today && p.paymentDate <= weekAhead)
    .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
})

// ── Overdue payments ────────────────────────────────────────────
const overduePayments = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return monthPending.value
    .filter((p) => p.paymentDate < today)
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
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Controle Mensal</h1>
    <div class="flex gap-3 items-center">
      <div class="flex items-center gap-1.5">
        <label for="homeMonth" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Mes</label>
        <select id="homeMonth" v-model.number="filterMonth" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">{{ name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label for="homeYear" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Ano</label>
        <select id="homeYear" v-model.number="filterYear" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
            {{ now.getFullYear() - 3 + y }}
          </option>
        </select>
      </div>
    </div>
  </div>

  <!-- ── Summary cards ──────────────────────────────────────────── -->
  <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mt-6">
    <div class="dash-card">
      <p class="order-first mb-1 text-[0.8125rem] text-text-muted font-medium uppercase tracking-[0.04em]">
        Saldo total
      </p>
      <h2 class="text-2xl font-bold text-primary break-words !mb-1 !tracking-normal">
        {{ formatCurrency(totalBalance) }}
      </h2>
    </div>
    <div class="dash-card">
      <p class="order-first mb-1 text-[0.8125rem] text-text-muted font-medium uppercase tracking-[0.04em]">
        Pago este mes
      </p>
      <h2 class="text-2xl font-bold text-success break-words !mb-1 !tracking-normal">
        {{ formatCurrency(monthTotalPaid) }}
      </h2>
      <span class="text-xs text-text-muted mt-0.5">{{ monthPaid.length }} pagamento(s)</span>
    </div>
    <div class="dash-card">
      <p class="order-first mb-1 text-[0.8125rem] text-text-muted font-medium uppercase tracking-[0.04em]">
        Pendente este mes
      </p>
      <h2 class="text-2xl font-bold text-warning break-words !mb-1 !tracking-normal">
        {{ formatCurrency(monthTotalPending) }}
      </h2>
      <span class="text-xs text-text-muted mt-0.5">{{ monthPending.length }} pagamento(s)</span>
    </div>
    <div class="dash-card">
      <p class="order-first mb-1 text-[0.8125rem] text-text-muted font-medium uppercase tracking-[0.04em]">
        Total do mes
      </p>
      <h2 class="text-2xl font-bold text-primary break-words !mb-1 !tracking-normal">
        {{ formatCurrency(monthTotalAll) }}
      </h2>
      <span class="text-xs text-text-muted mt-0.5">{{ monthPayments.length }} pagamento(s)</span>
    </div>
  </div>

  <!-- ── Progress bar ───────────────────────────────────────────── -->
  <section v-if="monthPayments.length > 0" class="dash-section">
    <h2 class="text-[0.9375rem] font-semibold mb-4 !tracking-normal">Progresso do mes</h2>
    <div class="h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
      <div
        class="h-full bg-success rounded-full transition-[width] duration-[400ms] ease-out"
        :style="{ width: monthProgress + '%' }"
      />
    </div>
    <div class="flex justify-between mt-2 text-[0.8125rem] text-text-muted">
      <span>{{ monthProgress }}% concluido</span>
      <span>
        {{ monthPaid.length + monthSkipped.length }} / {{ monthPayments.length }} resolvidos
      </span>
    </div>
  </section>

  <!-- ── Bank accounts ──────────────────────────────────────────── -->
  <section v-if="bankAccountStore.accounts.length > 0" class="dash-section">
    <h2 class="text-[0.9375rem] font-semibold mb-4 !tracking-normal">Contas</h2>
    <div class="flex flex-col gap-2">
      <div
        v-for="account in bankAccountStore.accounts"
        :key="account.id"
        class="flex items-center justify-between px-3 py-2 bg-black/[0.03] rounded-sm"
      >
        <span class="text-sm font-medium text-text-secondary">{{ account.name }}</span>
        <span
          class="text-sm font-semibold"
          :class="account.currentBalance < 0 ? 'text-danger' : 'text-success'"
        >
          {{ formatCurrency(account.currentBalance) }}
        </span>
      </div>
    </div>
  </section>

  <!-- ── Overdue payments ───────────────────────────────────────── -->
  <section v-if="overduePayments.length > 0" class="dash-section border-danger bg-danger-dim">
    <h2 class="text-[0.9375rem] font-semibold mb-4 text-danger !tracking-normal">
      Pagamentos atrasados
    </h2>
    <table class="!mt-0 !border-0 !rounded-none">
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
              class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
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
  <section v-if="upcomingPayments.length > 0" class="dash-section">
    <h2 class="text-[0.9375rem] font-semibold mb-4 !tracking-normal">Proximos 7 dias</h2>
    <table class="!mt-0 !border-0 !rounded-none">
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
              class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
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
  <section v-if="categoryBreakdown.length > 0" class="dash-section">
    <h2 class="text-[0.9375rem] font-semibold mb-4 !tracking-normal">Gastos por categoria</h2>
    <div class="flex flex-col gap-2.5">
      <div v-for="cat in categoryBreakdown" :key="cat.name" class="flex items-center gap-3">
        <div class="min-w-[120px] shrink-0">
          <span
            class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            :style="{ backgroundColor: cat.color }"
          >
            {{ cat.name }}
          </span>
        </div>
        <div class="flex-1 h-2 bg-black/[0.04] rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-[width] duration-[400ms] ease-out min-w-1"
            :style="{
              width: (monthTotalAll > 0 ? (cat.total / monthTotalAll) * 100 : 0) + '%',
              backgroundColor: cat.color,
            }"
          />
        </div>
        <span class="text-[0.8125rem] font-semibold text-text-secondary min-w-[90px] text-right">
          {{ formatCurrency(cat.total) }}
        </span>
      </div>
    </div>
  </section>

  <!-- ── Monthly status breakdown ───────────────────────────────── -->
  <section v-if="monthPayments.length > 0" class="dash-section">
    <h2 class="text-[0.9375rem] font-semibold mb-4 !tracking-normal">Resumo por status</h2>
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2.5 px-3 py-2 bg-black/[0.03] rounded-sm">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-warning" />
        <span class="text-sm font-medium text-text-secondary min-w-[80px]">
          {{ STATUS_LABELS.pending }}
        </span>
        <span class="text-xs text-text-muted bg-black/[0.04] px-2 py-0.5 rounded-full">
          {{ monthPending.length }}
        </span>
        <span class="text-sm font-semibold text-text-secondary ml-auto">
          {{ formatCurrency(monthTotalPending) }}
        </span>
      </div>
      <div class="flex items-center gap-2.5 px-3 py-2 bg-black/[0.03] rounded-sm">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-success" />
        <span class="text-sm font-medium text-text-secondary min-w-[80px]">
          {{ STATUS_LABELS.paid }}
        </span>
        <span class="text-xs text-text-muted bg-black/[0.04] px-2 py-0.5 rounded-full">
          {{ monthPaid.length }}
        </span>
        <span class="text-sm font-semibold text-text-secondary ml-auto">
          {{ formatCurrency(monthTotalPaid) }}
        </span>
      </div>
      <div class="flex items-center gap-2.5 px-3 py-2 bg-black/[0.03] rounded-sm">
        <span class="w-2.5 h-2.5 rounded-full shrink-0 bg-text-muted" />
        <span class="text-sm font-medium text-text-secondary min-w-[80px]">
          {{ STATUS_LABELS.skipped }}
        </span>
        <span class="text-xs text-text-muted bg-black/[0.04] px-2 py-0.5 rounded-full">
          {{ monthSkipped.length }}
        </span>
        <span class="text-sm font-semibold text-text-secondary ml-auto">
          {{ formatCurrency(monthSkipped.reduce((s, p) => s + p.value, 0)) }}
        </span>
      </div>
    </div>
  </section>

  <!-- ── Recent batches ─────────────────────────────────────────── -->
  <section v-if="recentBatches.length > 0" class="dash-section">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[0.9375rem] font-semibold !mb-0 !tracking-normal">Ultimos lotes</h2>
      <RouterLink to="/payment-batches" class="btn-link">Ver todos</RouterLink>
    </div>
    <table class="!mt-0 !border-0 !rounded-none">
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
@reference "../assets/main.css";

.dash-card {
  @apply flex flex-col overflow-hidden bg-surface border border-border rounded-lg p-6 text-center
         transition-all duration-200 hover:border-border-hover hover:shadow-glow hover:-translate-y-0.5;
}

.dash-section {
  @apply mt-6 p-5 bg-surface border border-border rounded-lg;
}
</style>
