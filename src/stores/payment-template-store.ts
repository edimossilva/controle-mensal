import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PaymentTemplate, CreatePaymentTemplateInput } from '@/entities'
import { PaymentTemplateUseCases } from '@/usecases'
import {
  LocalStoragePaymentTemplateRepository,
  LocalStorageOwnerRepository,
  LocalStoragePaymentCategoryRepository,
  LocalStoragePaymentRepository,
} from '@/adapters/repositories'

const templateRepo = new LocalStoragePaymentTemplateRepository()
const ownerRepo = new LocalStorageOwnerRepository()
const categoryRepo = new LocalStoragePaymentCategoryRepository()
const paymentRepo = new LocalStoragePaymentRepository()
const useCases = new PaymentTemplateUseCases(templateRepo, ownerRepo, categoryRepo, paymentRepo)

export const usePaymentTemplateStore = defineStore('payment-template', () => {
  const templates = ref<PaymentTemplate[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    templates.value = useCases.getAll()
  }

  function getById(id: string): PaymentTemplate | undefined {
    return useCases.getById(id)
  }

  function create(input: CreatePaymentTemplateInput): boolean {
    const result = useCases.create(input)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function update(template: PaymentTemplate) {
    useCases.update(template)
    loadAll()
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { templates, error, loadAll, getById, create, update, remove }
})
