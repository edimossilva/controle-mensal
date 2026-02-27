import type { Transaction, CreateTransactionInput } from '@/entities'
import { createTransaction } from '@/entities'
import type { TransactionRepository, BankAccountRepository } from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class TransactionUseCases {
  constructor(
    private transactionRepo: TransactionRepository,
    private bankAccountRepo: BankAccountRepository,
  ) {}

  getAll(): Transaction[] {
    return this.transactionRepo.getAll()
  }

  getById(id: string): Transaction | undefined {
    return this.transactionRepo.getById(id)
  }

  create(input: CreateTransactionInput): UseCaseResult & { transaction?: Transaction } {
    const origin = this.bankAccountRepo.getById(input.originAccountId)
    const destination = this.bankAccountRepo.getById(input.destinationAccountId)

    if (!origin || !destination) {
      return { success: false, error: 'Conta de origem ou destino não encontrada.' }
    }

    const transaction = createTransaction(input)
    this.transactionRepo.create(transaction)

    origin.currentBalance -= input.amount
    destination.currentBalance += input.amount
    this.bankAccountRepo.update(origin)
    this.bankAccountRepo.update(destination)

    return { success: true, transaction }
  }

  update(updated: Transaction): UseCaseResult {
    const existing = this.transactionRepo.getById(updated.id)
    if (!existing) {
      return { success: false, error: 'Transação não encontrada.' }
    }

    this.reverseBalanceEffect(existing)
    this.applyBalanceEffect(updated)

    this.transactionRepo.update(updated)
    return { success: true }
  }

  delete(id: string): UseCaseResult {
    const transaction = this.transactionRepo.getById(id)
    if (!transaction) {
      return { success: false, error: 'Transação não encontrada.' }
    }

    this.reverseBalanceEffect(transaction)
    this.transactionRepo.delete(id)
    return { success: true }
  }

  private applyBalanceEffect(transaction: Transaction): void {
    const origin = this.bankAccountRepo.getById(transaction.originAccountId)
    const destination = this.bankAccountRepo.getById(transaction.destinationAccountId)

    if (origin) {
      origin.currentBalance -= transaction.amount
      this.bankAccountRepo.update(origin)
    }
    if (destination) {
      destination.currentBalance += transaction.amount
      this.bankAccountRepo.update(destination)
    }
  }

  private reverseBalanceEffect(transaction: Transaction): void {
    const origin = this.bankAccountRepo.getById(transaction.originAccountId)
    const destination = this.bankAccountRepo.getById(transaction.destinationAccountId)

    if (origin) {
      origin.currentBalance += transaction.amount
      this.bankAccountRepo.update(origin)
    }
    if (destination) {
      destination.currentBalance -= transaction.amount
      this.bankAccountRepo.update(destination)
    }
  }
}
