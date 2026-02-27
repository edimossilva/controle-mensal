import type { DocumentData, Firestore } from 'firebase/firestore'
import type { BankAccount } from '@/entities'
import type { BankAccountRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(account: BankAccount): DocumentData {
  return {
    id: account.id,
    name: account.name,
    currentBalance: account.currentBalance,
    initialBalance: account.initialBalance,
    ownerId: account.ownerId,
  }
}

function deserialize(data: DocumentData): BankAccount {
  return {
    id: data.id as string,
    name: data.name as string,
    currentBalance: data.currentBalance as number,
    initialBalance: data.initialBalance as number,
    ownerId: data.ownerId as string,
  }
}

export class FirestoreBankAccountRepository
  extends FirestoreRepository<BankAccount>
  implements BankAccountRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'bankAccounts', serialize, deserialize)
  }

  getByOwnerId(ownerId: string): BankAccount[] {
    return this.getAll().filter((account) => account.ownerId === ownerId)
  }
}
