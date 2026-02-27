export interface Transaction {
  id: string
  name: string
  description: string
  amount: number
  originAccountId: string
  destinationAccountId: string
  date: Date
}

export interface CreateTransactionInput {
  name: string
  description: string
  amount: number
  originAccountId: string
  destinationAccountId: string
  date: Date
}

export function createTransaction(input: CreateTransactionInput): Transaction {
  return {
    id: crypto.randomUUID(),
    ...input,
  }
}
