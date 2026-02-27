import type { Transaction } from '@/entities'
import type { TransactionRepository } from '@/usecases/ports'
import { LocalStorageRepository } from './local-storage-repository'

const STORAGE_KEY = 'controle-mensal:transactions'

function deserializeTransaction(raw: unknown): Transaction {
  const record = raw as Record<string, unknown>
  return {
    ...record,
    date: new Date(record.date as string),
  } as Transaction
}

export class LocalStorageTransactionRepository
  extends LocalStorageRepository<Transaction>
  implements TransactionRepository
{
  constructor() {
    super(STORAGE_KEY, deserializeTransaction)
  }

  getByAccountId(accountId: string): Transaction[] {
    return this.getAll().filter(
      (t) => t.originAccountId === accountId || t.destinationAccountId === accountId,
    )
  }
}
