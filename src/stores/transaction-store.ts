import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Transaction, CreateTransactionInput } from '@/entities'
import { TransactionUseCases } from '@/usecases'
import {
  LocalStorageBankAccountRepository,
  LocalStorageTransactionRepository,
} from '@/adapters/repositories'

const transactionRepo = new LocalStorageTransactionRepository()
const bankAccountRepo = new LocalStorageBankAccountRepository()
const useCases = new TransactionUseCases(transactionRepo, bankAccountRepo)

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<Transaction[]>([])
  const error = ref<string | null>(null)

  function loadAll() {
    transactions.value = useCases.getAll()
  }

  function getById(id: string): Transaction | undefined {
    return useCases.getById(id)
  }

  function create(input: CreateTransactionInput): boolean {
    const result = useCases.create(input)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function update(transaction: Transaction): boolean {
    const result = useCases.update(transaction)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  function remove(id: string): boolean {
    const result = useCases.delete(id)
    error.value = result.error ?? null
    if (result.success) loadAll()
    return result.success
  }

  return { transactions, error, loadAll, getById, create, update, remove }
})
