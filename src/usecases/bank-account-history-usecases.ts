import type { BalanceHistoryEntry } from '@/entities'
import type { TransactionRepository, PaymentRepository, PaymentTemplateRepository } from './ports'

export class BankAccountHistoryUseCases {
  constructor(
    private transactionRepo: TransactionRepository,
    private paymentRepo: PaymentRepository,
    private templateRepo: PaymentTemplateRepository,
  ) {}

  getByAccountId(accountId: string): BalanceHistoryEntry[] {
    const transactionEntries = this.buildTransactionEntries(accountId)
    const paymentEntries = this.buildPaymentEntries(accountId)

    return [...transactionEntries, ...paymentEntries].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    )
  }

  private buildTransactionEntries(accountId: string): BalanceHistoryEntry[] {
    return this.transactionRepo.getByAccountId(accountId).map((transaction) => {
      const isOrigin = transaction.originAccountId === accountId
      return {
        id: transaction.id,
        date: transaction.date,
        type: 'transaction' as const,
        description: transaction.name,
        amount: isOrigin ? -transaction.amount : transaction.amount,
        targetAccountId: isOrigin ? transaction.destinationAccountId : transaction.originAccountId,
      }
    })
  }

  private buildPaymentEntries(accountId: string): BalanceHistoryEntry[] {
    return this.paymentRepo
      .getByBankAccountId(accountId)
      .filter((payment) => payment.status === 'paid')
      .map((payment) => {
        const template = this.templateRepo.getById(payment.templateId)
        return {
          id: payment.id,
          date: payment.paymentDate,
          type: 'payment' as const,
          description: template?.name ?? 'Pagamento',
          amount: -payment.value,
        }
      })
  }
}
