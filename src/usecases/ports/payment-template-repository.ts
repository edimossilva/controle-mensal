import type { PaymentTemplate } from '@/entities'
import type { Repository } from './repository'

export interface PaymentTemplateRepository extends Repository<PaymentTemplate> {
  getByOwnerId(ownerId: string): PaymentTemplate[]
  getByCategoryId(categoryId: string): PaymentTemplate[]
}
