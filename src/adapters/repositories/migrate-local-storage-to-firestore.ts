import type { Repository } from '@/usecases/ports'
import { LocalStorageOwnerRepository } from './owner-repository'
import { LocalStorageBankAccountRepository } from './bank-account-repository'
import { LocalStorageTransactionRepository } from './transaction-repository'
import { LocalStoragePaymentCategoryRepository } from './payment-category-repository'
import { LocalStoragePaymentTemplateRepository } from './payment-template-repository'
import { LocalStoragePaymentRepository } from './payment-repository'
import {
  getOwnerRepository,
  getBankAccountRepository,
  getTransactionRepository,
  getPaymentCategoryRepository,
  getPaymentTemplateRepository,
  getPaymentRepository,
} from './repository-provider'

function migrateCollection<T extends { id: string }>(
  source: { getAll(): T[] },
  target: Repository<T>,
): number {
  const items = source.getAll()
  for (const item of items) {
    target.create(item)
  }
  return items.length
}

export interface MigrationResult {
  owners: number
  bankAccounts: number
  transactions: number
  paymentCategories: number
  paymentTemplates: number
  payments: number
  total: number
}

export function migrateLocalStorageToFirestore(): MigrationResult {
  const owners = migrateCollection(new LocalStorageOwnerRepository(), getOwnerRepository())
  const bankAccounts = migrateCollection(
    new LocalStorageBankAccountRepository(),
    getBankAccountRepository(),
  )
  const transactions = migrateCollection(
    new LocalStorageTransactionRepository(),
    getTransactionRepository(),
  )
  const paymentCategories = migrateCollection(
    new LocalStoragePaymentCategoryRepository(),
    getPaymentCategoryRepository(),
  )
  const paymentTemplates = migrateCollection(
    new LocalStoragePaymentTemplateRepository(),
    getPaymentTemplateRepository(),
  )
  const payments = migrateCollection(new LocalStoragePaymentRepository(), getPaymentRepository())

  return {
    owners,
    bankAccounts,
    transactions,
    paymentCategories,
    paymentTemplates,
    payments,
    total: owners + bankAccounts + transactions + paymentCategories + paymentTemplates + payments,
  }
}
