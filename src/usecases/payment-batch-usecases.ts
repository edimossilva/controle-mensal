import type { PaymentBatch, CreatePaymentBatchInput } from '@/entities'
import { createPaymentBatch } from '@/entities'
import type { PaymentBatchRepository, PaymentRepository, BankAccountRepository } from './ports'

interface UseCaseResult {
  success: boolean
  error?: string
}

export class PaymentBatchUseCases {
  constructor(
    private batchRepo: PaymentBatchRepository,
    private paymentRepo: PaymentRepository,
    private bankAccountRepo: BankAccountRepository,
  ) {}

  getAll(): PaymentBatch[] {
    return this.batchRepo.getAll()
  }

  getById(id: string): PaymentBatch | undefined {
    return this.batchRepo.getById(id)
  }

  create(input: CreatePaymentBatchInput): UseCaseResult & { batch?: PaymentBatch } {
    if (input.paymentIds.length === 0) {
      return { success: false, error: 'Selecione ao menos um pagamento.' }
    }

    for (const paymentId of input.paymentIds) {
      const payment = this.paymentRepo.getById(paymentId)
      if (!payment) {
        return { success: false, error: `Pagamento ${paymentId} nao encontrado.` }
      }
      if (payment.status !== 'pending') {
        return { success: false, error: `Pagamento "${paymentId}" nao esta pendente.` }
      }
    }

    const batch = createPaymentBatch(input)
    this.batchRepo.create(batch)

    for (const paymentId of input.paymentIds) {
      const payment = this.paymentRepo.getById(paymentId)!
      payment.status = 'paid'
      payment.updatedAt = new Date()
      this.paymentRepo.update(payment)
      this.applyBalanceEffect(payment)
    }

    return { success: true, batch }
  }

  delete(id: string): UseCaseResult {
    const batch = this.batchRepo.getById(id)
    if (!batch) {
      return { success: false, error: 'Lote nao encontrado.' }
    }
    this.batchRepo.delete(id)
    return { success: true }
  }

  private applyBalanceEffect(payment: { bankAccountId: string; value: number }): void {
    const account = this.bankAccountRepo.getById(payment.bankAccountId)
    if (account) {
      account.currentBalance -= payment.value
      this.bankAccountRepo.update(account)
    }
  }
}
