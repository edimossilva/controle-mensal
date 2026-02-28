import type { PaymentCategory } from '@/entities'
import { createPaymentCategory } from '@/entities'
import type { PaymentCategoryRepository, PaymentTemplateRepository, PaymentRepository } from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class PaymentCategoryUseCases {
  constructor(
    private categoryRepo: PaymentCategoryRepository,
    private templateRepo: PaymentTemplateRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  getAll(): PaymentCategory[] {
    return this.categoryRepo.getAll()
  }

  getById(id: string): PaymentCategory | undefined {
    return this.categoryRepo.getById(id)
  }

  create(name: string, color: string, description?: string): PaymentCategory {
    const category = createPaymentCategory(name, color, description)
    this.categoryRepo.create(category)
    return category
  }

  update(category: PaymentCategory): void {
    category.updatedAt = new Date()
    this.categoryRepo.update(category)
  }

  delete(id: string): UseCaseResult {
    const templates = this.templateRepo.getByCategoryId(id)
    if (templates.length > 0) {
      return {
        success: false,
        error: 'Nao e possivel excluir a categoria pois existem modelos vinculados.',
      }
    }
    const payments = this.paymentRepo.getByCategoryId(id)
    if (payments.length > 0) {
      return {
        success: false,
        error: 'Nao e possivel excluir a categoria pois existem pagamentos vinculados.',
      }
    }
    this.categoryRepo.delete(id)
    return { success: true }
  }
}
