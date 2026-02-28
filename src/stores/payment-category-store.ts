import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PaymentCategory } from '@/entities'
import { PaymentCategoryUseCases } from '@/usecases'
import {
  getPaymentCategoryRepository,
  getPaymentTemplateRepository,
  getPaymentRepository,
} from '@/adapters/repositories/repository-provider'

function createUseCases() {
  return new PaymentCategoryUseCases(
    getPaymentCategoryRepository(),
    getPaymentTemplateRepository(),
    getPaymentRepository(),
  )
}

export const usePaymentCategoryStore = defineStore('payment-category', () => {
  const categories = ref<PaymentCategory[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    categories.value = createUseCases().getAll()
  }

  function getById(id: string): PaymentCategory | undefined {
    return createUseCases().getById(id)
  }

  function create(name: string, color: string, description?: string) {
    createUseCases().create(name, color, description)
    loadAll()
  }

  function update(category: PaymentCategory) {
    createUseCases().update(category)
    loadAll()
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { categories, error, loadAll, getById, create, update, remove }
})
