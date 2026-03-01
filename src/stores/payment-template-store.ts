import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PaymentTemplate, CreatePaymentTemplateInput } from '@/entities'
import { PaymentTemplateUseCases } from '@/usecases'
import {
  getPaymentTemplateRepository,
  getOwnerRepository,
  getPaymentCategoryRepository,
  getPaymentRepository,
} from '@/adapters/repositories/repository-provider'
import { useNotificationStore } from './notification-store'

function createUseCases() {
  return new PaymentTemplateUseCases(
    getPaymentTemplateRepository(),
    getOwnerRepository(),
    getPaymentCategoryRepository(),
    getPaymentRepository(),
  )
}

export const usePaymentTemplateStore = defineStore('payment-template', () => {
  const templates = ref<PaymentTemplate[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    templates.value = createUseCases().getAll()
  }

  function getById(id: string): PaymentTemplate | undefined {
    return createUseCases().getById(id)
  }

  function create(input: CreatePaymentTemplateInput): boolean {
    const result = createUseCases().create(input)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Modelo criado com sucesso.')
    }
    return result.success
  }

  function update(template: PaymentTemplate) {
    createUseCases().update(template)
    loadAll()
    useNotificationStore().success('Modelo atualizado com sucesso.')
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Modelo excluido com sucesso.')
    }
    return result.success
  }

  return { templates, error, loadAll, getById, create, update, remove }
})
