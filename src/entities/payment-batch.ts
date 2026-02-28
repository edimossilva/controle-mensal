export interface PaymentBatch {
  id: string
  name: string
  date: Date
  paymentIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreatePaymentBatchInput {
  name: string
  date: Date
  paymentIds: string[]
}

export function createPaymentBatch(input: CreatePaymentBatchInput): PaymentBatch {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  }
}
