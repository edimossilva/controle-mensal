<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import type { ActiveElement, ChartEvent, Chart } from 'chart.js'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentAnalyticsStore } from '@/stores/payment-analytics-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import type { Payment, PaymentStatus } from '@/entities'
import {
  barChartOptions,
  doughnutChartOptions,
  formatCurrency,
  paletteColor,
  PRIMARY_COLOR,
} from '@/components/charts/chart-config'
import type { PaymentGroupBy, MonthPoint } from '@/usecases'

const paymentStore = usePaymentStore()
const analyticsStore = usePaymentAnalyticsStore()
const categoryStore = usePaymentCategoryStore()
const ownerStore = useOwnerStore()
const templateStore = usePaymentTemplateStore()

const MONTH_COUNT_OPTIONS = [3, 6, 12, 24]
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

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const groupBy = ref<PaymentGroupBy>('category')
const monthCount = ref(6)
const totalsMonthCount = ref(12)

const selectedCategoryIds = reactive(new Set<string>())

const allCategoriesSelected = computed(
  () =>
    categoryStore.categories.length > 0 &&
    categoryStore.categories.every((category) => selectedCategoryIds.has(category.id)),
)

function toggleCategory(categoryId: string) {
  if (selectedCategoryIds.has(categoryId)) {
    selectedCategoryIds.delete(categoryId)
  } else {
    selectedCategoryIds.add(categoryId)
  }
}

function toggleAllCategories() {
  if (allCategoriesSelected.value) {
    selectedCategoryIds.clear()
  } else {
    for (const category of categoryStore.categories) {
      selectedCategoryIds.add(category.id)
    }
  }
}

const categoryFilter = computed(() => [...selectedCategoryIds])

// `paymentStore.payments` keeps the analytics reactive: edits elsewhere
// trigger `loadAll()`, which recomputes everything below.
const monthlyTotals = computed(() => {
  void paymentStore.payments
  return analyticsStore.getMonthlyTotals(totalsMonthCount.value, categoryFilter.value)
})

const groupedTotals = computed(() => {
  void paymentStore.payments
  return analyticsStore.getMonthlyTotalsByGroup(
    monthCount.value,
    groupBy.value,
    categoryFilter.value,
  )
})

function monthLabel({ year, month }: MonthPoint): string {
  return `${MONTH_ABBREVIATIONS[month]}/${String(year).slice(2)}`
}

function groupName(groupId: string): string {
  if (groupBy.value === 'category') {
    return categoryStore.getById(groupId)?.name ?? 'Sem categoria'
  }
  return ownerStore.getById(groupId)?.name ?? 'Desconhecido'
}

function groupColor(groupId: string, index: number): string {
  if (groupBy.value === 'category') {
    return categoryStore.getById(groupId)?.color ?? paletteColor(index)
  }
  return paletteColor(index)
}

const hasData = computed(() => groupedTotals.value.groups.length > 0)
const hasTotalsData = computed(() => monthlyTotals.value.some((entry) => entry.total > 0))

const periodTotal = computed(() =>
  groupedTotals.value.groups.reduce((sum, group) => sum + group.periodTotal, 0),
)

const monthlyTotalsChartData = computed(() => ({
  labels: monthlyTotals.value.map(monthLabel),
  datasets: [
    {
      data: monthlyTotals.value.map((entry) => entry.total),
      backgroundColor: PRIMARY_COLOR,
      borderRadius: 4,
    },
  ],
}))

const stackedChartData = computed(() => ({
  labels: groupedTotals.value.months.map(monthLabel),
  datasets: groupedTotals.value.groups.map((group, index) => ({
    label: groupName(group.groupId),
    data: group.totalsByMonth,
    backgroundColor: groupColor(group.groupId, index),
  })),
}))

const distributionChartData = computed(() => ({
  labels: groupedTotals.value.groups.map((group) => groupName(group.groupId)),
  datasets: [
    {
      data: groupedTotals.value.groups.map((group) => group.periodTotal),
      backgroundColor: groupedTotals.value.groups.map((group, index) =>
        groupColor(group.groupId, index),
      ),
      borderWidth: 0,
    },
  ],
}))

const rankingChartData = computed(() => ({
  labels: groupedTotals.value.groups.map((group) => groupName(group.groupId)),
  datasets: [
    {
      data: groupedTotals.value.groups.map((group) => group.periodTotal),
      backgroundColor: groupedTotals.value.groups.map((group, index) =>
        groupColor(group.groupId, index),
      ),
      borderRadius: 4,
    },
  ],
}))

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  skipped: 'Ignorado',
}

const detailDialog = ref<HTMLDialogElement>()
const detailGroupId = ref<string | null>(null)
const detailGroupIndex = ref(0)
const detailMonth = ref<MonthPoint | null>(null)

const detailPayments = computed<Payment[]>(() => {
  if (!detailGroupId.value || !detailMonth.value) return []
  void paymentStore.payments
  return analyticsStore.getPaymentsForGroupInMonth(
    groupBy.value,
    detailGroupId.value,
    detailMonth.value,
    categoryFilter.value,
  )
})

const detailTotal = computed(() =>
  detailPayments.value.reduce((sum, payment) => sum + payment.value, 0),
)

function ownerName(ownerId: string): string {
  return ownerStore.getById(ownerId)?.name ?? 'Desconhecido'
}

function categoryName(categoryId: string): string {
  return categoryStore.getById(categoryId)?.name ?? 'Sem categoria'
}

function categoryColor(categoryId: string): string {
  return categoryStore.getById(categoryId)?.color ?? '#888'
}

function templateName(templateId?: string): string {
  if (!templateId) return '—'
  return templateStore.getById(templateId)?.name ?? 'Desconhecido'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function handleStackedBarClick(_event: ChartEvent, elements: ActiveElement[]) {
  const element = elements[0]
  if (!element) return
  const group = groupedTotals.value.groups[element.datasetIndex]
  const month = groupedTotals.value.months[element.index]
  if (!group || !month) return
  detailGroupId.value = group.groupId
  detailGroupIndex.value = element.datasetIndex
  detailMonth.value = month
  detailDialog.value?.showModal()
}

function closeDetail() {
  detailDialog.value?.close()
  detailGroupId.value = null
  detailMonth.value = null
}

function setPointerCursor(event: ChartEvent, elements: ActiveElement[], chart: Chart) {
  chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default'
}

const simpleBarOptions = barChartOptions()
const stackedBarOptions = {
  ...barChartOptions({ stacked: true }),
  onClick: handleStackedBarClick,
  onHover: setPointerCursor,
}
const horizontalBarOptions = barChartOptions({ horizontal: true })
const doughnutOptions = doughnutChartOptions()

onMounted(() => {
  paymentStore.loadAll()
  categoryStore.loadAll()
  ownerStore.loadAll()
  for (const category of categoryStore.categories) {
    selectedCategoryIds.add(category.id)
  }
})
</script>

<template>
  <h1>Graficos de Pagamentos</h1>

  <div class="flex gap-3 items-end flex-wrap mb-6">
    <div class="flex items-center gap-1.5">
      <label for="groupBy" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">
        Agrupar por
      </label>
      <select id="groupBy" v-model="groupBy" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
        <option value="category">Categoria</option>
        <option value="owner">Titular</option>
      </select>
    </div>
    <div class="flex items-center gap-1.5">
      <label for="monthCount" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">
        Periodo
      </label>
      <select
        id="monthCount"
        v-model.number="monthCount"
        class="!w-auto !py-1 !px-2 text-[0.8125rem]"
      >
        <option v-for="option in MONTH_COUNT_OPTIONS" :key="option" :value="option">
          Ultimos {{ option }} meses
        </option>
      </select>
    </div>
    <span v-if="hasData" class="text-sm text-text-secondary ml-auto">
      Total do periodo: <strong>{{ formatCurrency(periodTotal) }}</strong>
    </span>
  </div>

  <section v-if="categoryStore.categories.length" class="chart-card mb-6">
    <div class="flex items-center gap-x-4 gap-y-2 flex-wrap px-5 py-3.5">
      <span class="text-[0.8125rem] font-medium text-text-muted shrink-0">Categorias</span>
      <label
        v-for="category in categoryStore.categories"
        :key="category.id"
        class="!mb-0 flex items-center gap-1.5 text-[0.8125rem] text-text-secondary cursor-pointer select-none"
      >
        <input
          type="checkbox"
          class="!w-auto"
          :checked="selectedCategoryIds.has(category.id)"
          @change="toggleCategory(category.id)"
        />
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: category.color }"
        />
        {{ category.name }}
      </label>
      <button
        type="button"
        class="btn-link !text-[0.8125rem] shrink-0 ml-auto"
        @click="toggleAllCategories"
      >
        {{ allCategoriesSelected ? 'Desmarcar todas' : 'Marcar todas' }}
      </button>
    </div>
  </section>

  <div v-if="hasData" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <section class="chart-card lg:col-span-2">
      <header class="chart-card-header flex items-center justify-between gap-4">
        <h2 class="chart-card-title">Evolucao mensal por {{ groupBy === 'category' ? 'categoria' : 'titular' }}</h2>
        <span class="text-xs text-text-muted">
          Clique em uma barra para ver os pagamentos
        </span>
      </header>
      <div class="h-80 p-5 pt-2">
        <Bar :data="stackedChartData" :options="stackedBarOptions" />
      </div>
    </section>

    <section class="chart-card">
      <header class="chart-card-header">
        <h2 class="chart-card-title">Distribuicao no periodo</h2>
      </header>
      <div class="h-80 p-5 pt-2">
        <Doughnut :data="distributionChartData" :options="doughnutOptions" />
      </div>
    </section>

    <section class="chart-card">
      <header class="chart-card-header">
        <h2 class="chart-card-title">Ranking do periodo</h2>
      </header>
      <div class="h-80 p-5 pt-2">
        <Bar :data="rankingChartData" :options="horizontalBarOptions" />
      </div>
    </section>
  </div>
  <p v-else>Nenhum pagamento no periodo selecionado.</p>

  <section class="chart-card mt-4">
    <header class="chart-card-header flex items-center justify-between">
      <h2 class="chart-card-title">Totais por mes</h2>
      <div class="flex items-center gap-1.5">
        <label for="totalsMonthCount" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">
          Periodo
        </label>
        <select
          id="totalsMonthCount"
          v-model.number="totalsMonthCount"
          class="!w-auto !py-1 !px-2 text-[0.8125rem]"
        >
          <option v-for="option in MONTH_COUNT_OPTIONS" :key="option" :value="option">
            Ultimos {{ option }} meses
          </option>
        </select>
      </div>
    </header>
    <div v-if="hasTotalsData" class="h-80 p-5 pt-2">
      <Bar :data="monthlyTotalsChartData" :options="simpleBarOptions" />
    </div>
    <p v-else class="p-5 !mb-0">Nenhum pagamento no periodo selecionado.</p>
  </section>

  <dialog
    ref="detailDialog"
    class="!m-auto !min-w-[640px] max-w-[820px]"
    @close="closeDetail"
  >
    <template v-if="detailGroupId">
      <div class="flex items-center justify-between gap-4 mb-1">
        <div class="flex items-center gap-2.5">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: groupColor(detailGroupId, detailGroupIndex) }"
          />
          <h2 class="text-[1.05rem] !mb-0 !tracking-normal">{{ groupName(detailGroupId) }}</h2>
          <span class="text-xs font-semibold text-text-muted bg-black/[0.04] px-2 py-0.5 rounded-full">
            {{ detailPayments.length }}
          </span>
        </div>
        <span class="text-sm font-semibold text-text-secondary whitespace-nowrap">
          {{ formatCurrency(detailTotal) }}
        </span>
      </div>
      <p v-if="detailMonth" class="text-[0.8125rem] !mb-0 text-text-muted">
        {{ MONTH_NAMES[detailMonth.month] }} {{ detailMonth.year }}
      </p>

      <div class="max-h-[60vh] overflow-y-auto">
        <table v-if="detailPayments.length" class="!mt-3">
          <thead>
            <tr>
              <th>Data</th>
              <th>Modelo</th>
              <th>Nome</th>
              <th>{{ groupBy === 'category' ? 'Titular' : 'Categoria' }}</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in detailPayments" :key="payment.id">
              <td>{{ formatDate(payment.paymentDate) }}</td>
              <td>{{ templateName(payment.templateId) }}</td>
              <td>{{ payment.name ?? '—' }}</td>
              <td>
                <template v-if="groupBy === 'category'">{{ ownerName(payment.ownerId) }}</template>
                <span
                  v-else
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                  :style="{ backgroundColor: categoryColor(payment.categoryId) }"
                >
                  {{ categoryName(payment.categoryId) }}
                </span>
              </td>
              <td>{{ formatCurrency(payment.value) }}</td>
              <td>{{ STATUS_LABELS[payment.status] }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="!mt-3">Nenhum pagamento no periodo selecionado.</p>
      </div>

      <div class="dialog-actions">
        <button type="button" class="btn btn-secondary" @click="closeDetail">Fechar</button>
      </div>
    </template>
  </dialog>
</template>

<style scoped>
@reference "../../assets/main.css";

.chart-card {
  @apply bg-surface border border-border rounded-lg overflow-hidden;
}

.chart-card-header {
  @apply px-5 py-3.5;
}

.chart-card-title {
  @apply text-[0.9375rem] font-semibold !mb-0 !tracking-normal;
}
</style>
