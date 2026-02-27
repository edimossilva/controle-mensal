import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Payment, CreatePaymentInput } from '@/entities'
import { PaymentUseCases } from '@/usecases'
import {
  getPaymentRepository,
  getPaymentTemplateRepository,
  getBankAccountRepository,
  getOwnerRepository,
} from '@/adapters/repositories/repository-provider'

function createUseCases() {
  return new PaymentUseCases(
    getPaymentRepository(),
    getPaymentTemplateRepository(),
    getBankAccountRepository(),
    getOwnerRepository(),
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
    if (result.success) loadAll()
    return result.success
  }

  function update(payment: Payment): boolean {
    const result = createUseCases().update(payment)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { payments, error, loadAll, getById, create, update, remove }
})
