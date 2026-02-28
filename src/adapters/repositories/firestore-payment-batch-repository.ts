import { Timestamp, type DocumentData, type Firestore } from 'firebase/firestore'
import type { PaymentBatch } from '@/entities'
import type { PaymentBatchRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(batch: PaymentBatch): DocumentData {
  return {
    id: batch.id,
    name: batch.name,
    date: Timestamp.fromDate(batch.date),
    paymentIds: batch.paymentIds,
    createdAt: Timestamp.fromDate(batch.createdAt),
    updatedAt: Timestamp.fromDate(batch.updatedAt),
  }
}

function deserialize(data: DocumentData): PaymentBatch {
  return {
    id: data.id as string,
    name: data.name as string,
    date: (data.date as Timestamp).toDate(),
    paymentIds: data.paymentIds as string[],
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }
}

export class FirestorePaymentBatchRepository
  extends FirestoreRepository<PaymentBatch>
  implements PaymentBatchRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'paymentBatches', serialize, deserialize)
  }

  getByPaymentId(paymentId: string): PaymentBatch[] {
    return this.getAll().filter((b) => b.paymentIds.includes(paymentId))
  }
}
