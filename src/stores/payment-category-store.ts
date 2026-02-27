import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PaymentCategory } from '@/entities'
import { PaymentCategoryUseCases } from '@/usecases'
import {
  LocalStoragePaymentCategoryRepository,
  LocalStoragePaymentTemplateRepository,
} from '@/adapters/repositories'

const categoryRepo = new LocalStoragePaymentCategoryRepository()
const templateRepo = new LocalStoragePaymentTemplateRepository()
const useCases = new PaymentCategoryUseCases(categoryRepo, templateRepo)

export const usePaymentCategoryStore = defineStore('payment-category', () => {
  const categories = ref<PaymentCategory[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    categories.value = useCases.getAll()
  }

  function getById(id: string): PaymentCategory | undefined {
    return useCases.getById(id)
  }

  function create(name: string, color: string, description?: string) {
    useCases.create(name, color, description)
    loadAll()
  }

  function update(category: PaymentCategory) {
    useCases.update(category)
    loadAll()
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { categories, error, loadAll, getById, create, update, remove }
})
