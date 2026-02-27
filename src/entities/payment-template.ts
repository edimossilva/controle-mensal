export interface PaymentTemplate {
  id: string
  name: string
  description?: string
  dueDateDay?: number
  value: number
  website?: string
  websiteUsername?: string
  websitePassword?: string
  ownerId: string
  categoryId: string
}

export interface CreatePaymentTemplateInput {
  name: string
  description?: string
  dueDateDay?: number
  value: number
  website?: string
  websiteUsername?: string
  websitePassword?: string
  ownerId: string
  categoryId: string
}

export function createPaymentTemplate(input: CreatePaymentTemplateInput): PaymentTemplate {
  return {
    id: crypto.randomUUID(),
    ...input,
  }
}
