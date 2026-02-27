import type { BankAccount } from '@/entities'
import type { BankAccountRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:bank-accounts'

export class LocalStorageBankAccountRepository
  extends LocalStorageRepository<BankAccount>
  implements BankAccountRepository
{
  constructor() {
    super(STORAGE_KEY)
  }

  getByOwnerId(ownerId: string): BankAccount[] {
    return this.getAll().filter((account) => account.ownerId === ownerId)
  }
}
