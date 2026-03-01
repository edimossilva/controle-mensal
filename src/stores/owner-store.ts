import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Owner } from '@/entities'
import { OwnerUseCases } from '@/usecases'
import {
  getOwnerRepository,
  getBankAccountRepository,
  getPaymentTemplateRepository,
  getPaymentRepository,
} from '@/adapters/repositories/repository-provider'
import { useNotificationStore } from './notification-store'

function createUseCases() {
  return new OwnerUseCases(
    getOwnerRepository(),
    getBankAccountRepository(),
    getPaymentTemplateRepository(),
    getPaymentRepository(),
  )
}

export const useOwnerStore = defineStore('owner', () => {
  const owners = ref<Owner[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    owners.value = createUseCases().getAll()
  }

  function getById(id: string): Owner | undefined {
    return createUseCases().getById(id)
  }

  function create(name: string) {
    createUseCases().create(name)
    loadAll()
    useNotificationStore().success('Titular criado com sucesso.')
  }

  function update(owner: Owner) {
    createUseCases().update(owner)
    loadAll()
    useNotificationStore().success('Titular atualizado com sucesso.')
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Titular excluido com sucesso.')
    }
    return result.success
  }

  return { owners, error, loadAll, getById, create, update, remove }
})
