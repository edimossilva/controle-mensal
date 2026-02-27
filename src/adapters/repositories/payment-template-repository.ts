import type { PaymentTemplate } from '@/entities'
import type { PaymentTemplateRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:payment-templates'

export class LocalStoragePaymentTemplateRepository
  extends LocalStorageRepository<PaymentTemplate>
  implements PaymentTemplateRepository
{
  constructor() {
    super(STORAGE_KEY)
  }

  getByOwnerId(ownerId: string): PaymentTemplate[] {
    return this.getAll().filter((t) => t.ownerId === ownerId)
  }

  getByCategoryId(categoryId: string): PaymentTemplate[] {
    return this.getAll().filter((t) => t.categoryId === categoryId)
  }
}
