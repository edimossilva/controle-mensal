import type { PaymentBatch } from '@/entities'
import type { Repository } from './repository'

export interface PaymentBatchRepository extends Repository<PaymentBatch> {
  getByPaymentId(paymentId: string): PaymentBatch[]
}
