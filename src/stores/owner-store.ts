import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Owner } from '@/entities'
import { OwnerUseCases } from '@/usecases'
import {
  LocalStorageOwnerRepository,
  LocalStorageBankAccountRepository,
  LocalStoragePaymentTemplateRepository,
  LocalStoragePaymentRepository,
} from '@/adapters/repositories'

const ownerRepo = new LocalStorageOwnerRepository()
const bankAccountRepo = new LocalStorageBankAccountRepository()
const paymentTemplateRepo = new LocalStoragePaymentTemplateRepository()
const paymentRepo = new LocalStoragePaymentRepository()
const useCases = new OwnerUseCases(ownerRepo, bankAccountRepo, paymentTemplateRepo, paymentRepo)

export const useOwnerStore = defineStore('owner', () => {
  const owners = ref<Owner[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    owners.value = useCases.getAll()
  }

  function getById(id: string): Owner | undefined {
    return useCases.getById(id)
  }

  function create(name: string) {
    useCases.create(name)
    loadAll()
  }

  function update(owner: Owner) {
    useCases.update(owner)
    loadAll()
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { owners, error, loadAll, getById, create, update, remove }
})
