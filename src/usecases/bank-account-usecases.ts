import type { BankAccount } from '@/entities'
import { createBankAccount } from '@/entities'
import type { OwnerRepository, BankAccountRepository, TransactionRepository } from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class BankAccountUseCases {
  constructor(
    private bankAccountRepo: BankAccountRepository,
    private ownerRepo: OwnerRepository,
    private transactionRepo: TransactionRepository,
  ) {}

  getAll(): BankAccount[] {
    return this.bankAccountRepo.getAll()
  }

  getById(id: string): BankAccount | undefined {
    return this.bankAccountRepo.getById(id)
  }

  create(
    name: string,
    initialBalance: number,
    ownerId: string,
  ): UseCaseResult & { account?: BankAccount } {
    const owner = this.ownerRepo.getById(ownerId)
    if (!owner) {
      return { success: false, error: 'Titular não encontrado.' }
    }
    const account = createBankAccount(name, initialBalance, ownerId)
    this.bankAccountRepo.create(account)
    return { success: true, account }
  }

  update(account: BankAccount): void {
    const existing = this.bankAccountRepo.getById(account.id)
    if (existing) {
      const initialBalanceDiff = account.initialBalance - existing.initialBalance
      account.currentBalance += initialBalanceDiff
    }
    this.bankAccountRepo.update(account)
  }

  delete(id: string): UseCaseResult {
    const transactions = this.transactionRepo.getByAccountId(id)
    if (transactions.length > 0) {
      return {
        success: false,
        error: 'Não é possível excluir a conta pois existem transações vinculadas.',
      }
    }
    this.bankAccountRepo.delete(id)
    return { success: true }
  }
}
