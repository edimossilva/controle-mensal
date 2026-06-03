import { defineStore } from 'pinia'
import type { Payment } from '@/entities'
import { PaymentAnalyticsUseCases } from '@/usecases'
import type { PaymentGroupBy, MonthPoint, MonthlyTotal, GroupedMonthlyTotals } from '@/usecases'
import { getPaymentRepository } from '@/adapters/repositories/repository-provider'

function createUseCases() {
  return new PaymentAnalyticsUseCases(getPaymentRepository())
}

export const usePaymentAnalyticsStore = defineStore('payment-analytics', () => {
  function getMonthlyTotals(monthCount: number, categoryIds?: readonly string[]): MonthlyTotal[] {
    return createUseCases().getMonthlyTotals(monthCount, new Date(), categoryIds)
  }

  function getMonthlyTotalsByGroup(
    monthCount: number,
    groupBy: PaymentGroupBy,
    categoryIds?: readonly string[],
  ): GroupedMonthlyTotals {
    return createUseCases().getMonthlyTotalsByGroup(monthCount, groupBy, new Date(), categoryIds)
  }

  function getPaymentsForGroupInMonth(
    groupBy: PaymentGroupBy,
    groupId: string,
    month: MonthPoint,
    categoryIds?: readonly string[],
  ): Payment[] {
    return createUseCases().getPaymentsForGroupInMonth(groupBy, groupId, month, categoryIds)
  }

  return { getMonthlyTotals, getMonthlyTotalsByGroup, getPaymentsForGroupInMonth }
})
