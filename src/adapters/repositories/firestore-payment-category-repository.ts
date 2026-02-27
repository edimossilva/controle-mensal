import { Timestamp, type DocumentData, type Firestore } from 'firebase/firestore'
import type { PaymentCategory } from '@/entities'
import type { PaymentCategoryRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(category: PaymentCategory): DocumentData {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? null,
    color: category.color,
    createdAt: Timestamp.fromDate(category.createdAt),
    updatedAt: Timestamp.fromDate(category.updatedAt),
  }
}

function deserialize(data: DocumentData): PaymentCategory {
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) ?? undefined,
    color: data.color as string,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  }
}

export class FirestorePaymentCategoryRepository
  extends FirestoreRepository<PaymentCategory>
  implements PaymentCategoryRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'paymentCategories', serialize, deserialize)
  }
}
