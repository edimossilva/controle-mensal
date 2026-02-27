import { Timestamp, type DocumentData, type Firestore } from 'firebase/firestore'
import type { Payment, PaymentStatus } from '@/entities'
import type { PaymentRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(payment: Payment): DocumentData {
  return {
    id: payment.id,
    templateId: payment.templateId,
    paymentDate: Timestamp.fromDate(payment.paymentDate),
    dueDateDay: payment.dueDateDay ?? null,
    value: payment.value,
    status: payment.status,
    bankAccountId: payment.bankAccountId,
    ownerId: payment.ownerId,
    notes: payment.notes ?? null,
    createdAt: Timestamp.fromDate(payment.createdAt),
    updatedAt: Timestamp.fromDate(payment.updatedAt),
  }
}

function deserialize(data: DocumentData): Payment {
  return {
    id: data.id as string,
    templateId: data.templateId as string,
    paymentDate: (data.paymentDate as Timestamp).toDate(),
    dueDateDay: (data.dueDateDay as number) ?? undefined,
    value: data.value as number,
    status: data.status as PaymentStatus,
    bankAccountId: data.bankAccountId as string,
    ownerId: data.ownerId as string,
    notes: (data.notes as string) ?? undefined,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }
}

export class FirestorePaymentRepository
  extends FirestoreRepository<Payment>
  implements PaymentRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'payments', serialize, deserialize)
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
