import type { Payment } from '@/entities'
import type { PaymentRepository } from './ports'

export type PaymentGroupBy = 'category' | 'owner'

export interface MonthPoint {
  year: number
  month: number
}

export interface MonthlyTotal extends MonthPoint {
  total: number
}

export interface GroupTotals {
  groupId: string
  totalsByMonth: number[]
  periodTotal: number
}

export interface GroupedMonthlyTotals {
  months: MonthPoint[]
  groups: GroupTotals[]
}

function lastMonths(monthCount: number, referenceDate: Date): MonthPoint[] {
  const months: MonthPoint[] = []
  for (let offset = monthCount - 1; offset >= 0; offset--) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1)
    months.push({ year: date.getFullYear(), month: date.getMonth() })
  }
  return months
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`
}

export class PaymentAnalyticsUseCases {
  constructor(private paymentRepo: PaymentRepository) {}

  getMonthlyTotals(
    monthCount: number,
    referenceDate: Date,
    categoryIds?: readonly string[],
  ): MonthlyTotal[] {
    const months = lastMonths(monthCount, referenceDate)
    const totalsByMonth = new Map<string, number>(
      months.map(({ year, month }) => [monthKey(year, month), 0]),
    )

    for (const payment of this.getCountablePayments(categoryIds)) {
      const key = monthKey(payment.paymentDate.getFullYear(), payment.paymentDate.getMonth())
      const current = totalsByMonth.get(key)
      if (current !== undefined) {
        totalsByMonth.set(key, current + payment.value)
      }
    }

    return months.map(({ year, month }) => ({
      year,
      month,
      total: totalsByMonth.get(monthKey(year, month)) ?? 0,
    }))
  }

  getMonthlyTotalsByGroup(
    monthCount: number,
    groupBy: PaymentGroupBy,
    referenceDate: Date,
    categoryIds?: readonly string[],
  ): GroupedMonthlyTotals {
    const months = lastMonths(monthCount, referenceDate)
    const monthIndexByKey = new Map<string, number>(
      months.map(({ year, month }, index) => [monthKey(year, month), index]),
    )
    const totalsByGroup = new Map<string, number[]>()

    for (const payment of this.getCountablePayments(categoryIds)) {
      const key = monthKey(payment.paymentDate.getFullYear(), payment.paymentDate.getMonth())
      const monthIndex = monthIndexByKey.get(key)
      if (monthIndex === undefined) continue

      const groupId = groupBy === 'category' ? payment.categoryId : payment.ownerId
      let totals = totalsByGroup.get(groupId)
      if (!totals) {
        totals = Array.from({ length: months.length }, () => 0)
        totalsByGroup.set(groupId, totals)
      }
      totals[monthIndex] = (totals[monthIndex] ?? 0) + payment.value
    }

    const groups: GroupTotals[] = [...totalsByGroup.entries()]
      .map(([groupId, totalsByMonth]) => ({
        groupId,
        totalsByMonth,
        periodTotal: totalsByMonth.reduce((sum, value) => sum + value, 0),
      }))
      .sort((a, b) => b.periodTotal - a.periodTotal)

    return { months, groups }
  }

  getPaymentsForGroupInMonth(
    groupBy: PaymentGroupBy,
    groupId: string,
    month: MonthPoint,
    categoryIds?: readonly string[],
  ): Payment[] {
    return this.getCountablePayments(categoryIds)
      .filter(
        (payment) =>
          (groupBy === 'category' ? payment.categoryId : payment.ownerId) === groupId &&
          payment.paymentDate.getFullYear() === month.year &&
          payment.paymentDate.getMonth() === month.month,
      )
      .sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime())
  }

  private getCountablePayments(categoryIds?: readonly string[]): Payment[] {
    const allowedCategoryIds = categoryIds ? new Set(categoryIds) : null
    return this.paymentRepo
      .getAll()
      .filter(
        (payment) =>
          payment.status !== 'skipped' &&
          (!allowedCategoryIds || allowedCategoryIds.has(payment.categoryId)),
      )
  }
}
