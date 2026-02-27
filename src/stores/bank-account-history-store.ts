import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BalanceHistoryEntry } from '@/entities'
import { BankAccountHistoryUseCases } from '@/usecases'
import {
  LocalStorageTransactionRepository,
  LocalStoragePaymentRepository,
  LocalStoragePaymentTemplateRepository,
} from '@/adapters/repositories'

const transactionRepo = new LocalStorageTransactionRepository()
const paymentRepo = new LocalStoragePaymentRepository()
const templateRepo = new LocalStoragePaymentTemplateRepository()
const useCases = new BankAccountHistoryUseCases(transactionRepo, paymentRepo, templateRepo)

export const useBankAccountHistoryStore = defineStore('bank-account-history', () => {
  const entries = ref<BalanceHistoryEntry[]>([])

  function loadByAccountId(accountId: string) {
    entries.value = useCases.getByAccountId(accountId)
  }

  return { entries, loadByAccountId }
})
