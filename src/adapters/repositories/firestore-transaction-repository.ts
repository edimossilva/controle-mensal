import { Timestamp, type DocumentData, type Firestore } from 'firebase/firestore'
import type { Transaction } from '@/entities'
import type { TransactionRepository } from '@/usecases/ports'
import { FirestoreRepository } from './firestore-repository'

function serialize(transaction: Transaction): DocumentData {
  return {
    id: transaction.id,
    name: transaction.name,
    description: transaction.description,
    amount: transaction.amount,
    originAccountId: transaction.originAccountId,
    destinationAccountId: transaction.destinationAccountId,
    date: Timestamp.fromDate(transaction.date),
  }
}

function deserialize(data: DocumentData): Transaction {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    amount: data.amount as number,
    originAccountId: data.originAccountId as string,
    destinationAccountId: data.destinationAccountId as string,
    date: (data.date as Timestamp).toDate(),
  }
}

export class FirestoreTransactionRepository
  extends FirestoreRepository<Transaction>
  implements TransactionRepository
{
  constructor(db: Firestore, userId: string) {
    super(db, userId, 'transactions', serialize, deserialize)
  }

  getByAccountId(accountId: string): Transaction[] {
    return this.getAll().filter(
      (t) => t.originAccountId === accountId || t.destinationAccountId === accountId,
    )
  }
}
