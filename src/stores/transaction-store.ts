import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transaction, CreateTransactionInput } from '@/entities'
import { TransactionUseCases } from '@/usecases'
import {
  getTransactionRepository,
  getBankAccountRepository,
} from '@/adapters/repositories/repository-provider'

function createUseCases() {
  return new TransactionUseCases(getTransactionRepository(), getBankAccountRepository())
}

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    transactions.value = createUseCases().getAll()
  }

  function getById(id: string): Transaction | undefined {
    return createUseCases().getById(id)
  }

  function create(input: CreateTransactionInput): boolean {
    const result = createUseCases().create(input)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function update(transaction: Transaction): boolean {
    const result = createUseCases().update(transaction)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function remove(id: string): boolean {
    const result = createUseCases().delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { transactions, error, loadAll, getById, create, update, remove }
})
