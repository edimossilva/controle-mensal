<script setup lang="ts">
import { onMounted } from 'vue'
import { useOwnerStore } from '@/stores/owner-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useTransactionStore } from '@/stores/transaction-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { usePaymentStore } from '@/stores/payment-store'

const ownerStore = useOwnerStore()
const bankAccountStore = useBankAccountStore()
const transactionStore = useTransactionStore()
const categoryStore = usePaymentCategoryStore()
const templateStore = usePaymentTemplateStore()
const paymentStore = usePaymentStore()

onMounted(() => {
  ownerStore.loadAll()
  bankAccountStore.loadAll()
  transactionStore.loadAll()
  categoryStore.loadAll()
  templateStore.loadAll()
  paymentStore.loadAll()
})
</script>

<template>
  <h1>Controle Mensal</h1>
  <div class="summary">
    <div class="card">
      <h2>{{ ownerStore.owners.length }}</h2>
      <p>Titulares</p>
    </div>
    <div class="card">
      <h2>{{ bankAccountStore.accounts.length }}</h2>
      <p>Contas</p>
    </div>
    <div class="card">
      <h2>{{ transactionStore.transactions.length }}</h2>
      <p>Transações</p>
    </div>
    <div class="card">
      <h2>{{ categoryStore.categories.length }}</h2>
      <p>Categorias</p>
    </div>
    <div class="card">
      <h2>{{ templateStore.templates.length }}</h2>
      <p>Modelos</p>
    </div>
    <div class="card">
      <h2>{{ paymentStore.payments.length }}</h2>
      <p>Pagamentos</p>
    </div>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  min-width: 150px;
}

.card h2 {
  margin: 0;
  font-size: 2rem;
  color: #42b883;
}

.card p {
  margin: 0.5rem 0 0;
  color: #666;
}
</style>
