import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BankAccount } from '@/entities'
import { BankAccountUseCases } from '@/usecases'
import {
  LocalStorageOwnerRepository,
  LocalStorageBankAccountRepository,
  LocalStorageTransactionRepository,
} from '@/adapters/repositories'

const bankAccountRepo = new LocalStorageBankAccountRepository()
const ownerRepo = new LocalStorageOwnerRepository()
const transactionRepo = new LocalStorageTransactionRepository()
const useCases = new BankAccountUseCases(bankAccountRepo, ownerRepo, transactionRepo)

export const useBankAccountStore = defineStore('bank-account', () => {
  const accounts = ref<BankAccount[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    accounts.value = useCases.getAll()
  }

  function getById(id: string): BankAccount | undefined {
    return useCases.getById(id)
  }

  function create(name: string, initialBalance: number, ownerId: string): boolean {
    const result = useCases.create(name, initialBalance, ownerId)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function update(account: BankAccount) {
    useCases.update(account)
    loadAll()
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { accounts, error, loadAll, getById, create, update, remove }
})
