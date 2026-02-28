import type { Payment } from '@/entities'
import type { Repository } from './repository'

export interface PaymentRepository extends Repository<Payment> {
  getByTemplateId(templateId: string): Payment[]
  getByBankAccountId(bankAccountId: string): Payment[]
  getByOwnerId(ownerId: string): Payment[]
  getByCategoryId(categoryId: string): Payment[]
}
