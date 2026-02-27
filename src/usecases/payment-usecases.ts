import type { Payment, CreatePaymentInput } from '@/entities'
import { createPayment } from '@/entities'
import type {
  PaymentRepository,
  PaymentTemplateRepository,
  BankAccountRepository,
  OwnerRepository,
} from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class PaymentUseCases {
  constructor(
    private paymentRepo: PaymentRepository,
    private templateRepo: PaymentTemplateRepository,
    private bankAccountRepo: BankAccountRepository,
    private ownerRepo: OwnerRepository,
  ) {}

  getAll(): Payment[] {
    return this.paymentRepo.getAll()
  }

  getById(id: string): Payment | undefined {
    return this.paymentRepo.getById(id)
  }

  create(input: CreatePaymentInput): UseCaseResult & { payment?: Payment } {
    const template = this.templateRepo.getById(input.templateId)
    if (!template) {
      return { success: false, error: 'Modelo nao encontrado.' }
    }
    const bankAccount = this.bankAccountRepo.getById(input.bankAccountId)
    if (!bankAccount) {
      return { success: false, error: 'Conta bancaria nao encontrada.' }
    }
    const owner = this.ownerRepo.getById(input.ownerId)
    if (!owner) {
      return { success: false, error: 'Titular nao encontrado.' }
    }
    const payment = createPayment(input)
    this.paymentRepo.create(payment)
    this.applyBalanceEffect(payment)
    return { success: true, payment }
  }

  update(updated: Payment): UseCaseResult {
    const existing = this.paymentRepo.getById(updated.id)
    if (!existing) {
      return { success: false, error: 'Pagamento nao encontrado.' }
    }
    this.reverseBalanceEffect(existing)
    updated.updatedAt = new Date()
    this.paymentRepo.update(updated)
    this.applyBalanceEffect(updated)
    return { success: true }
  }

  delete(id: string): UseCaseResult {
    const payment = this.paymentRepo.getById(id)
    if (!payment) {
      return { success: false, error: 'Pagamento nao encontrado.' }
    }
    this.reverseBalanceEffect(payment)
    this.paymentRepo.delete(id)
    return { success: true }
  }

  private applyBalanceEffect(payment: Payment): void {
    if (payment.status !== 'paid') return
    const account = this.bankAccountRepo.getById(payment.bankAccountId)
    if (account) {
      account.currentBalance -= payment.value
      this.bankAccountRepo.update(account)
    }
  }

  private reverseBalanceEffect(payment: Payment): void {
    if (payment.status !== 'paid') return
    const account = this.bankAccountRepo.getById(payment.bankAccountId)
    if (account) {
      account.currentBalance += payment.value
      this.bankAccountRepo.update(account)
    }
  }
}
