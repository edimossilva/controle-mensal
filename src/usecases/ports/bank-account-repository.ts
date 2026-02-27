import type { BankAccount } from '@/entities'
import type { Repository } from './repository'

export interface BankAccountRepository extends Repository<BankAccount> {
  getByOwnerId(ownerId: string): BankAccount[]
}
