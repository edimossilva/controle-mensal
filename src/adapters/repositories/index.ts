export { LocalStorageOwnerRepository } from './owner-repository'
export { LocalStorageBankAccountRepository } from './bank-account-repository'
export { LocalStorageTransactionRepository } from './transaction-repository'
export { LocalStoragePaymentCategoryRepository } from './payment-category-repository'
export { LocalStoragePaymentTemplateRepository } from './payment-template-repository'
export { LocalStoragePaymentRepository } from './payment-repository'

export { FirestoreOwnerRepository } from './firestore-owner-repository'
export { FirestoreBankAccountRepository } from './firestore-bank-account-repository'
export { FirestoreTransactionRepository } from './firestore-transaction-repository'
export { FirestorePaymentCategoryRepository } from './firestore-payment-category-repository'
export { FirestorePaymentTemplateRepository } from './firestore-payment-template-repository'
export { FirestorePaymentRepository } from './firestore-payment-repository'

export {
  initializeRepositories,
  clearRepositories,
  getOwnerRepository,
  getBankAccountRepository,
  getTransactionRepository,
  getPaymentCategoryRepository,
  getPaymentTemplateRepository,
  getPaymentRepository,
} from './repository-provider'
