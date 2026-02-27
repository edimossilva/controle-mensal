export interface BankAccount {
  id: string
  name: string
  currentBalance: number
  initialBalance: number
  ownerId: string
}

export function createBankAccount(
  name: string,
  initialBalance: number,
  ownerId: string,
): BankAccount {
  return {
    id: crypto.randomUUID(),
    name,
    currentBalance: initialBalance,
    initialBalance,
    ownerId,
  }
}
