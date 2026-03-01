import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BankAccount } from '@/entities'
import { BankAccountUseCases } from '@/usecases'
import {
  getBankAccountRepository,
  getOwnerRepository,
  getTransactionRepository,
  getPaymentRepository,
} from '@/adapters/repositories/repository-provider'
import { useNotificationStore } from './notification-store'

function createUseCases() {
  return new BankAccountUseCases(
    getBankAccountRepository(),
    getOwnerRepository(),
    getTransactionRepository(),
    getPaymentRepository(),
  )
}

export const useBankAccountStore = defineStore('bank-account', () => {
  const accounts = ref<BankAccount[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    accounts.value = createUseCases().getAll()
  }

  function getById(id: string): BankAccount | undefined {
    return createUseCases().getById(id)
  }

  function create(name: string, initialBalance: number, ownerId: string): boolean {
    const result = createUseCases().create(name, initialBalance, ownerId)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Conta bancaria criada com sucesso.')
    }
    return result.success
  }

  function update(account: BankAccount) {
    createUseCases().update(account)
    loadAll()
    useNotificationStore().success('Conta bancaria atualizada com sucesso.')
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) {
      loadAll()
      useNotificationStore().success('Conta bancaria excluida com sucesso.')
    }
    return result.success
  }

  return { accounts, error, loadAll, getById, create, update, remove }
})
