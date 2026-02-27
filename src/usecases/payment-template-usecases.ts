import type { PaymentTemplate, CreatePaymentTemplateInput } from '@/entities'
import { createPaymentTemplate } from '@/entities'
import type {
  PaymentTemplateRepository,
  OwnerRepository,
  PaymentCategoryRepository,
  PaymentRepository,
} from './ports'

export interface UseCaseResult {
  success: boolean
  error?: string
}

export class PaymentTemplateUseCases {
  constructor(
    private templateRepo: PaymentTemplateRepository,
    private ownerRepo: OwnerRepository,
    private categoryRepo: PaymentCategoryRepository,
    private paymentRepo: PaymentRepository,
  ) {}

  getAll(): PaymentTemplate[] {
    return this.templateRepo.getAll()
  }

  getById(id: string): PaymentTemplate | undefined {
    return this.templateRepo.getById(id)
  }

  create(input: CreatePaymentTemplateInput): UseCaseResult & { template?: PaymentTemplate } {
    const owner = this.ownerRepo.getById(input.ownerId)
    if (!owner) {
      return { success: false, error: 'Titular nao encontrado.' }
    }
    const category = this.categoryRepo.getById(input.categoryId)
    if (!category) {
      return { success: false, error: 'Categoria nao encontrada.' }
    }
    const template = createPaymentTemplate(input)
    this.templateRepo.create(template)
    return { success: true, template }
  }

  update(template: PaymentTemplate): void {
    this.templateRepo.update(template)
  }

  delete(id: string): UseCaseResult {
    const payments = this.paymentRepo.getByTemplateId(id)
    if (payments.length > 0) {
      return {
        success: false,
        error: 'Nao e possivel excluir o modelo pois existem pagamentos vinculados.',
      }
    }
    this.templateRepo.delete(id)
    return { success: true }
  }
}
