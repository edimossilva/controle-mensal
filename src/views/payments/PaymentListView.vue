<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { usePaymentBatchStore } from '@/stores/payment-batch-store'
import { useTransactionStore } from '@/stores/transaction-store'
import { useSortable } from '@/composables/use-sortable'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Payment, PaymentStatus } from '@/entities/payment'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const categoryStore = usePaymentCategoryStore()
const batchStore = usePaymentBatchStore()
const transactionStore = useTransactionStore()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()
const pendingDeleteId = ref<string>()
const showGenerateSection = ref(false)

const selectedPaymentIds = reactive(new Set<string>())
const showBatchForm = ref(false)
const batchName = ref('')
const batchDate = ref(new Date().toISOString().slice(0, 10))
const batchError = ref<string | null>(null)
const txOriginAccountId = ref('')
const txDestinationAccountId = ref('')

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

const { sortedItems, sortBy, sortClass } = useSortable(
  filteredPayments,
  {
    template: (p) => templateName(p.templateId).toLowerCase(),
    category: (p) => categoryName(p.categoryId).toLowerCase(),
    owner: (p) => ownerName(p.ownerId).toLowerCase(),
    account: (p) => accountName(p.bankAccountId).toLowerCase(),
    value: (p) => p.value,
    date: (p) => p.paymentDate,
    status: (p) => p.status,
  },
  { key: 'date' },
)

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

  const wantsTransaction = txOriginAccountId.value && txDestinationAccountId.value
  if (wantsTransaction && txOriginAccountId.value === txDestinationAccountId.value) {
    batchError.value = 'Contas de origem e destino devem ser diferentes.'
    return
  }

  const paymentIds = [...selectedPaymentIds]
  const batchDateValue = new Date(batchDate.value + 'T12:00:00')
  const name = batchName.value.trim()

  const success = batchStore.create({ name, date: batchDateValue, paymentIds })
  if (!success) {
    batchError.value = batchStore.error
    return
  }

  if (wantsTransaction) {
    const amount = paymentIds.reduce((sum, id) => {
      const p = store.getById(id)
      return p ? sum + p.value : sum
    }, 0)
    const txSuccess = transactionStore.create({
      name,
      description: `Lote: ${name} (${paymentIds.length} pagamentos)`,
      amount,
      originAccountId: txOriginAccountId.value,
      destinationAccountId: txDestinationAccountId.value,
      date: batchDateValue,
    })
    if (!txSuccess) {
      batchError.value = transactionStore.error
    }
  }

  selectedPaymentIds.clear()
  showBatchForm.value = false
  batchName.value = ''
  batchDate.value = new Date().toISOString().slice(0, 10)
  txOriginAccountId.value = ''
  txDestinationAccountId.value = ''
  store.loadAll()
  bankAccountStore.loadAll()
}
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <h1 class="!mb-0">Pagamentos</h1>
    <div class="flex gap-2">
      <button type="button" class="btn btn-secondary" @click="showGenerateSection = !showGenerateSection">
        {{ showGenerateSection ? 'Fechar gerador' : 'Gerar a partir dos modelos' }}
      </button>
      <RouterLink to="/payments/new" class="btn">Novo Pagamento</RouterLink>
    </div>
  </div>

  <div class="flex gap-3 items-end mt-4">
    <div class="flex items-center gap-1.5">
      <label for="filterMonth" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Mes</label>
      <select id="filterMonth" v-model.number="filterMonth" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
        <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
          {{ name }}
        </option>
      </select>
    </div>
    <div class="flex items-center gap-1.5">
      <label for="filterYear" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Ano</label>
      <select id="filterYear" v-model.number="filterYear" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
        <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
          {{ now.getFullYear() - 3 + y }}
        </option>
      </select>
    </div>
    <button
      v-if="filteredPayments.length > 0"
      type="button"
      class="btn btn-secondary !py-1 !px-2.5 text-[0.8125rem]"
      @click="showMoveSection = !showMoveSection"
    >
      {{ showMoveSection ? 'Cancelar' : 'Mover todos' }}
    </button>
  </div>

  <section v-if="showMoveSection" class="mt-3 p-4 px-5 bg-surface border border-border rounded-lg">
    <h2 class="text-[0.9375rem] !mb-3 !tracking-normal">
      Mover todos os pagamentos de {{ MONTH_NAMES[filterMonth] }} {{ filterYear }}
    </h2>
    <div class="flex items-end gap-3 flex-wrap">
      <div class="flex items-center gap-1.5">
        <label for="moveMonth" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Para mes</label>
        <select id="moveMonth" v-model.number="moveTargetMonth" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
            {{ name }}
          </option>
        </select>
      </div>
      <div class="flex items-center gap-1.5">
        <label for="moveYear" class="!mb-0 text-[0.8125rem] font-medium text-text-muted">Para ano</label>
        <select id="moveYear" v-model.number="moveTargetYear" class="!w-auto !py-1 !px-2 text-[0.8125rem]">
          <option v-for="y in 6" :key="y" :value="now.getFullYear() - 3 + y">
            {{ now.getFullYear() - 3 + y }}
          </option>
        </select>
      </div>
      <button type="button" class="btn" @click="handleMovePayments">Confirmar</button>
    </div>
    <div v-if="moveResult" class="mt-3 px-3 py-2 bg-success-dim text-success rounded-sm text-sm">
      {{ moveResult.moved }} pagamento(s) movido(s).
    </div>
  </section>

  <section v-if="showGenerateSection" class="mb-6 p-5 bg-surface border border-border rounded-lg">
    <h2 class="text-base !mb-4 !tracking-normal">Gerar pagamentos a partir dos modelos</h2>
    <form @submit.prevent="handleGenerate">
      <div class="flex items-end gap-4 flex-wrap">
        <div class="form-group !mb-0 flex-1 min-w-[140px]">
          <label for="generateMonth">Mes</label>
          <select id="generateMonth" v-model.number="generateMonth" required>
            <option v-for="(name, index) in MONTH_NAMES" :key="index" :value="index">
              {{ name }}
            </option>
          </select>
        </div>
        <div class="form-group !mb-0 flex-1 min-w-[140px]">
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
        <div class="form-group !mb-0 flex-1 min-w-[140px]">
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
        <button type="submit" class="btn shrink-0 h-[2.4rem]">Gerar</button>
      </div>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>

    <div v-if="generateResult" class="mt-3 px-3 py-2 bg-success-dim text-success rounded-sm text-sm">
      {{ generateResult.created }} pagamentos criados, {{ generateResult.skipped }} ja existentes.
    </div>
  </section>

  <div v-if="filteredPayments.length" class="flex flex-col gap-4 mt-5">
    <section
      v-for="[status, payments] in groupedPayments"
      :key="status"
      class="bg-surface border border-border rounded-lg overflow-hidden"
    >
      <header
        class="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none transition-colors duration-[120ms] hover:bg-surface-hover"
        @click="toggleGroup(status)"
      >
        <div class="flex items-center gap-2.5">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="{
              'bg-warning': status === 'pending',
              'bg-success': status === 'paid',
              'bg-text-muted': status === 'skipped',
            }"
          />
          <h2 class="text-[0.9375rem] font-semibold !mb-0 !tracking-normal">
            {{ STATUS_LABELS[status] }}
          </h2>
          <span class="text-xs font-semibold text-text-muted bg-white/[0.06] px-2 py-0.5 rounded-full">
            {{ payments.length }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-text-secondary">
            {{ formatCurrency(groupTotal(payments)) }}
          </span>
          <span
            class="text-xs text-text-muted transition-transform duration-200"
            :class="expandedGroups[status] ? 'rotate-0' : '-rotate-90'"
          >
            &#9662;
          </span>
        </div>
      </header>

      <div v-show="expandedGroups[status]" class="overflow-x-auto">
        <table class="!mt-0 !border-0 !rounded-none border-t border-t-border">
          <thead>
            <tr>
              <th v-if="status === 'pending'" class="w-10 text-center">
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
            <template v-for="payment in payments" :key="payment.id">
              <tr v-if="editingPaymentId === payment.id" @keydown.esc="cancelEdit" @keydown.enter="saveEdit">
                <td v-if="status === 'pending'" class="w-10 text-center" />
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
                    class="inline-input max-w-[100px]"
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
                <td />
              </tr>
              <tr v-if="editingPaymentId === payment.id" class="bg-surface!">
                <td :colspan="status === 'pending' ? 11 : 10" class="py-2! border-b-0!">
                  <div class="flex items-center gap-2">
                    <button type="button" class="btn py-1! px-3! text-[0.8125rem]" @click="saveEdit">
                      Salvar
                    </button>
                    <button type="button" class="btn btn-secondary py-1! px-3! text-[0.8125rem]" @click="cancelEdit">
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-else>
                <td v-if="status === 'pending'" class="w-10 text-center">
                  <input
                    type="checkbox"
                    :checked="selectedPaymentIds.has(payment.id)"
                    @change="togglePaymentSelection(payment.id)"
                  />
                </td>
                <td>{{ templateName(payment.templateId) }}</td>
                <td>
                  <span
                    class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white"
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
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </div>
  <p v-else-if="!store.error">
    Nenhum pagamento em {{ MONTH_NAMES[filterMonth] }} {{ filterYear }}.
  </p>

  <div
    v-if="selectedPaymentIds.size > 0"
    class="sticky bottom-0 bg-surface border border-primary rounded-lg px-5 py-3 mt-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_-2px_12px_rgba(0,0,0,0.15)] z-50"
  >
    <div class="text-sm text-text-secondary">
      <strong>{{ selectedPaymentIds.size }}</strong> pagamento(s) selecionado(s)
      &mdash; Total: <strong>{{ formatCurrency(selectedTotal) }}</strong>
    </div>
    <div v-if="!showBatchForm" class="flex gap-2">
      <button type="button" class="btn" @click="showBatchForm = true">Criar lote</button>
      <button type="button" class="btn btn-secondary" @click="selectedPaymentIds.clear()">
        Limpar
      </button>
    </div>
    <form v-else class="flex items-center gap-2 flex-wrap" @submit.prevent="handleCreateBatch">
      <input
        v-model="batchName"
        type="text"
        placeholder="Nome do lote"
        class="!w-auto px-2.5 py-1.5 text-sm border border-border rounded-sm bg-bg text-text"
        required
      />
      <input
        v-model="batchDate"
        type="date"
        class="!w-auto px-2.5 py-1.5 text-sm border border-border rounded-sm bg-bg text-text"
        required
      />
      <select
        v-model="txOriginAccountId"
        class="!w-auto px-2.5 py-1.5 text-sm border border-border rounded-sm bg-bg text-text"
      >
        <option value="">Conta origem (opcional)</option>
        <option
          v-for="account in bankAccountStore.accounts"
          :key="account.id"
          :value="account.id"
        >
          {{ account.name }}
        </option>
      </select>
      <select
        v-model="txDestinationAccountId"
        class="!w-auto px-2.5 py-1.5 text-sm border border-border rounded-sm bg-bg text-text"
      >
        <option value="">Conta destino (opcional)</option>
        <option
          v-for="account in bankAccountStore.accounts"
          :key="account.id"
          :value="account.id"
        >
          {{ account.name }}
        </option>
      </select>
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
@reference "../../assets/main.css";

.inline-input {
  @apply w-full min-w-[80px] px-1.5 py-1 text-[0.8125rem] border border-border rounded-sm bg-bg text-text;
}
</style>
