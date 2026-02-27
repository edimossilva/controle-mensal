<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useOwnerStore } from '@/stores/owner-store'
import { useEntityForm } from '@/composables/use-entity-form'
import type { PaymentStatus } from '@/entities'

const store = usePaymentStore()
const templateStore = usePaymentTemplateStore()
const bankAccountStore = useBankAccountStore()
const ownerStore = useOwnerStore()
const router = useRouter()
const { isEditMode, existing } = useEntityForm((id) => store.getById(id))

const templateId = ref('')
const paymentDate = ref(new Date().toISOString().slice(0, 10))
const dueDateDay = ref<number | undefined>()
const value = ref(0)
const status = ref<PaymentStatus>('pending')
const bankAccountId = ref('')
const ownerId = ref('')
const notes = ref('')

onMounted(() => {
  templateStore.loadAll()
  bankAccountStore.loadAll()
  ownerStore.loadAll()
})

watch(templateId, (id) => {
  if (isEditMode.value || !id) return
  const template = templateStore.getById(id)
  if (!template) return
  value.value = template.value
  dueDateDay.value = template.dueDateDay
  ownerId.value = template.ownerId
})

watch(existing, (entity) => {
  if (entity) {
    templateId.value = entity.templateId
    paymentDate.value = entity.paymentDate.toISOString().slice(0, 10)
    dueDateDay.value = entity.dueDateDay
    value.value = entity.value
    status.value = entity.status
    bankAccountId.value = entity.bankAccountId
    ownerId.value = entity.ownerId
    notes.value = entity.notes ?? ''
  }
})

function handleSubmit() {
  const parsedDate = new Date(paymentDate.value + 'T00:00:00')

  if (isEditMode.value && existing.value) {
    store.update({
      ...existing.value,
      templateId: templateId.value,
      paymentDate: parsedDate,
      dueDateDay: dueDateDay.value,
      value: value.value,
      status: status.value,
      bankAccountId: bankAccountId.value,
      ownerId: ownerId.value,
      notes: notes.value || undefined,
    })
  } else {
    store.create({
      templateId: templateId.value,
      paymentDate: parsedDate,
      dueDateDay: dueDateDay.value,
      value: value.value,
      status: status.value,
      bankAccountId: bankAccountId.value,
      ownerId: ownerId.value,
      notes: notes.value || undefined,
    })
  }

  if (store.error) return
  bankAccountStore.loadAll()
  router.push('/payments')
}
</script>

<template>
  <h1>{{ isEditMode ? 'Editar Pagamento' : 'Novo Pagamento' }}</h1>

  <p v-if="store.error" class="error">{{ store.error }}</p>

  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label for="templateId">Modelo</label>
      <select id="templateId" v-model="templateId" required>
        <option value="" disabled>Selecione um modelo</option>
        <option v-for="t in templateStore.templates" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label for="ownerId">Titular</label>
      <select id="ownerId" v-model="ownerId" required>
        <option value="" disabled>Selecione um titular</option>
        <option v-for="owner in ownerStore.owners" :key="owner.id" :value="owner.id">
          {{ owner.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label for="bankAccountId">Conta Bancaria</label>
      <select id="bankAccountId" v-model="bankAccountId" required>
        <option value="" disabled>Selecione uma conta</option>
        <option v-for="account in bankAccountStore.accounts" :key="account.id" :value="account.id">
          {{ account.name }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <label for="value">Valor</label>
      <input id="value" v-model.number="value" type="number" step="0.01" min="0.01" required />
    </div>
    <div class="form-group">
      <label for="paymentDate">Data de Pagamento</label>
      <input id="paymentDate" v-model="paymentDate" type="date" required />
    </div>
    <div class="form-group">
      <label for="dueDateDay">Dia de Vencimento</label>
      <input id="dueDateDay" v-model.number="dueDateDay" type="number" min="1" max="31" />
    </div>
    <div class="form-group">
      <label for="status">Status</label>
      <select id="status" v-model="status" required>
        <option value="pending">Pendente</option>
        <option value="paid">Pago</option>
        <option value="skipped">Ignorado</option>
      </select>
    </div>
    <div class="form-group">
      <label for="notes">Observacoes</label>
      <input id="notes" v-model="notes" type="text" />
    </div>
    <div class="form-actions">
      <button type="submit" class="btn">Salvar</button>
      <RouterLink to="/payments" class="btn btn-secondary">Cancelar</RouterLink>
    </div>
  </form>
</template>

<style scoped>
.form-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
</style>
