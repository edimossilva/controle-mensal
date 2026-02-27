import type { DocumentData, Firestore } from 'firebase/firestore'
import type { PaymentTemplate } from '@/entities'
import type { PaymentTemplateRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(template: PaymentTemplate): DocumentData {
  return {
    id: template.id,
    name: template.name,
    description: template.description ?? null,
    dueDateDay: template.dueDateDay ?? null,
    value: template.value,
    website: template.website ?? null,
    websiteUsername: template.websiteUsername ?? null,
    websitePassword: template.websitePassword ?? null,
    ownerId: template.ownerId,
    categoryId: template.categoryId,
  }
}

function deserialize(data: DocumentData): PaymentTemplate {
  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string) ?? undefined,
    dueDateDay: (data.dueDateDay as number) ?? undefined,
    value: data.value as number,
    website: (data.website as string) ?? undefined,
    websiteUsername: (data.websiteUsername as string) ?? undefined,
    websitePassword: (data.websitePassword as string) ?? undefined,
    ownerId: data.ownerId as string,
    categoryId: data.categoryId as string,
  }
}

export class FirestorePaymentTemplateRepository
  extends FirestoreRepository<PaymentTemplate>
  implements PaymentTemplateRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'paymentTemplates', serialize, deserialize)
  }

  getByOwnerId(ownerId: string): PaymentTemplate[] {
    return this.getAll().filter((t) => t.ownerId === ownerId)
  }

  getByCategoryId(categoryId: string): PaymentTemplate[] {
    return this.getAll().filter((t) => t.categoryId === categoryId)
  }
}
