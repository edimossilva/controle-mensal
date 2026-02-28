import type { Payment, CreatePaymentInput } from '@/entities'
import { createPayment } from '@/entities'
import type {
  PaymentRepository,
  PaymentTemplateRepository,
  BankAccountRepository,
  OwnerRepository,
  PaymentCategoryRepository,
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
    private categoryRepo: PaymentCategoryRepository,
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
    const category = this.categoryRepo.getById(input.categoryId)
    if (!category) {
      return { success: false, error: 'Categoria nao encontrada.' }
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
    const category = this.categoryRepo.getById(updated.categoryId)
    if (!category) {
      return { success: false, error: 'Categoria nao encontrada.' }
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

  generateFromTemplates(
    year: number,
    month: number,
    bankAccountId: string,
  ): UseCaseResult & { created: number; skipped: number } {
    const bankAccount = this.bankAccountRepo.getById(bankAccountId)
    if (!bankAccount) {
      return { success: false, error: 'Conta bancaria nao encontrada.', created: 0, skipped: 0 }
    }

    const templates = this.templateRepo.getAll()
    if (templates.length === 0) {
      return { success: false, error: 'Nenhum modelo cadastrado.', created: 0, skipped: 0 }
    }

    const allPayments = this.paymentRepo.getAll()
    let created = 0
    let skipped = 0

    for (const template of templates) {
      if (this.hasPaymentForMonth(allPayments, template.id, year, month)) {
        skipped++
        continue
      }

      const paymentDate = this.buildPaymentDate(year, month, template.dueDateDay)
      const payment = createPayment({
        templateId: template.id,
        paymentDate,
        dueDateDay: template.dueDateDay,
        value: template.value,
        status: 'pending',
        bankAccountId,
        ownerId: template.ownerId,
        categoryId: template.categoryId,
      })
      this.paymentRepo.create(payment)
      created++
    }

    return { success: true, created, skipped }
  }

  private hasPaymentForMonth(
    payments: Payment[],
    templateId: string,
    year: number,
    month: number,
  ): boolean {
    return payments.some(
      (p) =>
        p.templateId === templateId &&
        p.paymentDate.getFullYear() === year &&
        p.paymentDate.getMonth() === month,
    )
  }

  private buildPaymentDate(year: number, month: number, dueDateDay?: number): Date {
    if (!dueDateDay) return new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0).getDate()
    const day = Math.min(dueDateDay, lastDay)
    return new Date(year, month, day)
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
