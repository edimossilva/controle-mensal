import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Payment, CreatePaymentInput } from '@/entities'
import { PaymentUseCases } from '@/usecases'
import {
  LocalStoragePaymentRepository,
  LocalStoragePaymentTemplateRepository,
  LocalStorageBankAccountRepository,
  LocalStorageOwnerRepository,
} from '@/adapters/repositories'

const paymentRepo = new LocalStoragePaymentRepository()
const templateRepo = new LocalStoragePaymentTemplateRepository()
const bankAccountRepo = new LocalStorageBankAccountRepository()
const ownerRepo = new LocalStorageOwnerRepository()
const useCases = new PaymentUseCases(paymentRepo, templateRepo, bankAccountRepo, ownerRepo)

export const usePaymentStore = defineStore('payment', () => {
  const payments = ref<Payment[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    payments.value = useCases.getAll()
  }

  function getById(id: string): Payment | undefined {
    return useCases.getById(id)
  }

  function create(input: CreatePaymentInput): boolean {
    const result = useCases.create(input)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function update(payment: Payment): boolean {
    const result = useCases.update(payment)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { payments, error, loadAll, getById, create, update, remove }
})
