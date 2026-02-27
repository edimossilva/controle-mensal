import type { Payment } from '@/entities'
import type { PaymentRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:payments'

function deserializePayment(raw: unknown): Payment {
  const record = raw as Record<string, unknown>
  return {
    ...record,
    paymentDate: new Date(record.paymentDate as string),
    createdAt: new Date(record.createdAt as string),
    updatedAt: new Date(record.updatedAt as string),
  } as Payment
}

export class LocalStoragePaymentRepository
  extends LocalStorageRepository<Payment>
  implements PaymentRepository
{
  constructor() {
    super(STORAGE_KEY, deserializePayment)
  }

  getByTemplateId(templateId: string): Payment[] {
    return this.getAll().filter((p) => p.templateId === templateId)
  }

  getByBankAccountId(bankAccountId: string): Payment[] {
    return this.getAll().filter((p) => p.bankAccountId === bankAccountId)
  }

  getByOwnerId(ownerId: string): Payment[] {
    return this.getAll().filter((p) => p.ownerId === ownerId)
  }
}
