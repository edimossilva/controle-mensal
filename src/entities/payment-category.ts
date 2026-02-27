export interface PaymentCategory {
  id: string
  name: string
  description?: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export function createPaymentCategory(
  name: string,
  color: string,
  description?: string,
): PaymentCategory {
  const now = new Date()
  return {
    id: crypto.randomUUID(),
    name,
    description,
    color,
    createdAt: now,
    updatedAt: now,
  }
}
