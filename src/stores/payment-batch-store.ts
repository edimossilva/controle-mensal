import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PaymentBatch, CreatePaymentBatchInput } from '@/entities'
import { PaymentBatchUseCases } from '@/usecases'
import {
  getPaymentBatchRepository,
  getPaymentRepository,
  getBankAccountRepository,
} from '@/adapters/repositories/repository-provider'
import { useNotificationStore } from './notification-store'

function createUseCases() {
  return new PaymentBatchUseCases(
    getPaymentBatchRepository(),
    getPaymentRepository(),
    getBankAccountRepository(),
  )
}

export const usePaymentBatchStore = defineStore('paymentBatch', () => {
  const batches = ref<PaymentBatch[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    batches.value = createUseCases().getAll()
  }

  function getById(id: string): PaymentBatch | undefined {
    return createUseCases().getById(id)
  }

  function create(input: CreatePaymentBatchInput): boolean {
    const result = createUseCases().create(input)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Lote criado com sucesso.')
    }
    return result.success
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Lote excluido com sucesso.')
    }
    return result.success
  }

  return { batches, error, loadAll, getById, create, remove }
})
