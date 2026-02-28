import type { Firestore } from 'firebase/firestore'
import type {
  OwnerRepository,
  BankAccountRepository,
  TransactionRepository,
  PaymentCategoryRepository,
  PaymentTemplateRepository,
  PaymentRepository,
  PaymentBatchRepository,
} from '@/usecases/ports'
import { FirestoreOwnerRepository } from './firestore-owner-repository'
import { FirestoreBankAccountRepository } from './firestore-bank-account-repository'
import { FirestoreTransactionRepository } from './firestore-transaction-repository'
import { FirestorePaymentCategoryRepository } from './firestore-payment-category-repository'
import { FirestorePaymentTemplateRepository } from './firestore-payment-template-repository'
import { FirestorePaymentRepository } from './firestore-payment-repository'
import { FirestorePaymentBatchRepository } from './firestore-payment-batch-repository'

let ownerRepo: FirestoreOwnerRepository | null = null
let bankAccountRepo: FirestoreBankAccountRepository | null = null
let transactionRepo: FirestoreTransactionRepository | null = null
let paymentCategoryRepo: FirestorePaymentCategoryRepository | null = null
let paymentTemplateRepo: FirestorePaymentTemplateRepository | null = null
let paymentRepo: FirestorePaymentRepository | null = null
let paymentBatchRepo: FirestorePaymentBatchRepository | null = null

export async function initializeRepositories(db: Firestore, userId: string): Promise<void> {
  ownerRepo = new FirestoreOwnerRepository(db, userId)
  bankAccountRepo = new FirestoreBankAccountRepository(db, userId)
  transactionRepo = new FirestoreTransactionRepository(db, userId)
  paymentCategoryRepo = new FirestorePaymentCategoryRepository(db, userId)
  paymentTemplateRepo = new FirestorePaymentTemplateRepository(db, userId)
  paymentRepo = new FirestorePaymentRepository(db, userId)
  paymentBatchRepo = new FirestorePaymentBatchRepository(db, userId)

  await Promise.all([
    ownerRepo.initialize(),
    bankAccountRepo.initialize(),
    transactionRepo.initialize(),
    paymentCategoryRepo.initialize(),
    paymentTemplateRepo.initialize(),
    paymentRepo.initialize(),
    paymentBatchRepo.initialize(),
  ])
}

export function clearRepositories(): void {
  ownerRepo = null
  bankAccountRepo = null
  transactionRepo = null
  paymentCategoryRepo = null
  paymentTemplateRepo = null
  paymentRepo = null
  paymentBatchRepo = null
}

function assertRepo<T>(repo: T | null, name: string): T {
  if (!repo) {
    throw new Error(`${name} not initialized. Call initializeRepositories() first.`)
  }
  return repo
}

export function getOwnerRepository(): OwnerRepository {
  return assertRepo(ownerRepo, 'OwnerRepository')
}

export function getBankAccountRepository(): BankAccountRepository {
  return assertRepo(bankAccountRepo, 'BankAccountRepository')
}

export function getTransactionRepository(): TransactionRepository {
  return assertRepo(transactionRepo, 'TransactionRepository')
}

export function getPaymentCategoryRepository(): PaymentCategoryRepository {
  return assertRepo(paymentCategoryRepo, 'PaymentCategoryRepository')
}

export function getPaymentTemplateRepository(): PaymentTemplateRepository {
  return assertRepo(paymentTemplateRepo, 'PaymentTemplateRepository')
}

export function getPaymentRepository(): PaymentRepository {
  return assertRepo(paymentRepo, 'PaymentRepository')
}

export function getPaymentBatchRepository(): PaymentBatchRepository {
  return assertRepo(paymentBatchRepo, 'PaymentBatchRepository')
}
