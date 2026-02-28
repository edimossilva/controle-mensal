export type PaymentStatus = 'pending' | 'paid' | 'skipped'

export interface Payment {
  id: string
  templateId?: string
  paymentDate: Date
  dueDateDay?: number
  value: number
  status: PaymentStatus
  bankAccountId: string
  ownerId: string
  categoryId: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentInput {
  templateId?: string
  paymentDate: Date
  dueDateDay?: number
  value: number
  status?: PaymentStatus
  bankAccountId: string
  ownerId: string
  categoryId: string
  notes?: string
}

export function createPayment(input: CreatePaymentInput): Payment {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    ...input,
    status: input.status ?? 'pending',
    createdAt: now,
    updatedAt: now,
  }
}
