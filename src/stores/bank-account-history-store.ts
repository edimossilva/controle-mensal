import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BalanceHistoryEntry } from '@/entities'
import { BankAccountHistoryUseCases } from '@/usecases'
import {
  getTransactionRepository,
  getPaymentRepository,
  getPaymentTemplateRepository,
} from '@/adapters/repositories/repository-provider'

function createUseCases() {
  return new BankAccountHistoryUseCases(
    getTransactionRepository(),
    getPaymentRepository(),
    getPaymentTemplateRepository(),
  )
}

export const useBankAccountHistoryStore = defineStore('bank-account-history', () => {
  const entries = ref<BalanceHistoryEntry[]>([])

  function loadByAccountId(accountId: string) {
    entries.value = createUseCases().getByAccountId(accountId)
  }

  return { entries, loadByAccountId }
})
