export type BalanceHistoryEntryType = 'transaction' | 'payment'

export interface BalanceHistoryEntry {
  id: string
  date: Date
  type: BalanceHistoryEntryType
  description: string
  amount: number
}
