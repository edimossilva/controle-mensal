import type { Transaction } from '@/entities'
import type { Repository } from './repository'

export interface TransactionRepository extends Repository<Transaction> {
  getByAccountId(accountId: string): Transaction[]
}
