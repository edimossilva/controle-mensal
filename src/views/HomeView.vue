<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOwnerStore } from '@/stores/owner-store'
import { useBankAccountStore } from '@/stores/bank-account-store'
import { useTransactionStore } from '@/stores/transaction-store'
import { usePaymentCategoryStore } from '@/stores/payment-category-store'
import { usePaymentTemplateStore } from '@/stores/payment-template-store'
import { usePaymentStore } from '@/stores/payment-store'
import {
  migrateLocalStorageToFirestore,
  type MigrationResult,
} from '@/adapters/repositories/migrate-local-storage-to-firestore'

const ownerStore = useOwnerStore()
const bankAccountStore = useBankAccountStore()
const transactionStore = useTransactionStore()
const categoryStore = usePaymentCategoryStore()
const templateStore = usePaymentTemplateStore()
const paymentStore = usePaymentStore()

const migrating = ref(false)
const migrationResult = ref<MigrationResult | null>(null)
const migrationError = ref<string | null>(null)

onMounted(() => {
  ownerStore.loadAll()
  bankAccountStore.loadAll()
  transactionStore.loadAll()
  categoryStore.loadAll()
  templateStore.loadAll()
  paymentStore.loadAll()
})

function handleMigrate() {
  migrating.value = true
  migrationResult.value = null
  migrationError.value = null

  try {
    const result = migrateLocalStorageToFirestore()
    migrationResult.value = result

    ownerStore.loadAll()
    bankAccountStore.loadAll()
    transactionStore.loadAll()
    categoryStore.loadAll()
    templateStore.loadAll()
    paymentStore.loadAll()
  } catch (error) {
    migrationError.value = error instanceof Error ? error.message : 'Erro ao migrar dados'
  } finally {
    migrating.value = false
  }
}
</script>

<template>
  <h1>Controle Mensal</h1>
  <div class="card-grid">
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
      <p>Transacoes</p>
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

  <section class="migration-section">
    <h2>Migrar dados do LocalStorage</h2>
    <p>Importa todos os dados salvos no navegador (LocalStorage) para o banco de dados (Firestore).</p>
    <button class="btn-migrate" :disabled="migrating" @click="handleMigrate">
      {{ migrating ? 'Migrando...' : 'Migrar dados para Firestore' }}
    </button>

    <div v-if="migrationResult" class="migration-success">
      Migrados {{ migrationResult.total }} registros:
      {{ migrationResult.owners }} titulares,
      {{ migrationResult.bankAccounts }} contas,
      {{ migrationResult.transactions }} transacoes,
      {{ migrationResult.paymentCategories }} categorias,
      {{ migrationResult.paymentTemplates }} modelos,
      {{ migrationResult.payments }} pagamentos.
    </div>

    <div v-if="migrationError" class="migration-error">
      {{ migrationError }}
    </div>
  </section>
</template>

<style scoped>
.migration-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.migration-section h2 {
  margin-top: 0;
}

.migration-section p {
  color: #666;
  margin-bottom: 1rem;
}

.btn-migrate {
  padding: 0.6rem 1.2rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-migrate:hover:not(:disabled) {
  background-color: #388e3c;
}

.btn-migrate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.migration-success {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e8f5e9;
  border-radius: 4px;
  color: #2e7d32;
}

.migration-error {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #ffebee;
  border-radius: 4px;
  color: #c62828;
}
</style>
