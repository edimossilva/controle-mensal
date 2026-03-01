import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Payment, CreatePaymentInput } from '@/entities'
import { PaymentUseCases } from '@/usecases'
import {
  getPaymentRepository,
  getPaymentTemplateRepository,
  getBankAccountRepository,
  getOwnerRepository,
  getPaymentCategoryRepository,
} from '@/adapters/repositories/repository-provider'
import { useNotificationStore } from './notification-store'

function createUseCases() {
  return new PaymentUseCases(
    getPaymentRepository(),
    getPaymentTemplateRepository(),
    getBankAccountRepository(),
    getOwnerRepository(),
    getPaymentCategoryRepository(),
  )
}

export const usePaymentStore = defineStore('payment', () => {
  const payments = ref<Payment[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    payments.value = createUseCases().getAll()
  }

  function getById(id: string): Payment | undefined {
    return createUseCases().getById(id)
  }

  function create(input: CreatePaymentInput): boolean {
    const result = createUseCases().create(input)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Pagamento criado com sucesso.')
    }
    return result.success
  }

  function update(payment: Payment): boolean {
    const result = createUseCases().update(payment)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Pagamento atualizado com sucesso.')
    }
    return result.success
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Pagamento excluido com sucesso.')
    }
    return result.success
  }

  function generateFromTemplates(
    year: number,
    month: number,
    bankAccountId: string,
  ): { created: number; skipped: number } | null {
    const result = createUseCases().generateFromTemplates(year, month, bankAccountId)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success ? { created: result.created, skipped: result.skipped } : null
  }

  return { payments, error, loadAll, getById, create, update, remove, generateFromTemplates }
})
