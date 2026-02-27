import type { PaymentCategory } from '@/entities'
import type { PaymentCategoryRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:payment-categories'

function deserializePaymentCategory(raw: unknown): PaymentCategory {
  const record = raw as Record<string, unknown>
  return {
    ...record,
    createdAt: new Date(record.createdAt as string),
    updatedAt: new Date(record.updatedAt as string),
  } as PaymentCategory
}

export class LocalStoragePaymentCategoryRepository
  extends LocalStorageRepository<PaymentCategory>
  implements PaymentCategoryRepository
{
  constructor() {
    super(STORAGE_KEY, deserializePaymentCategory)
  }
}
