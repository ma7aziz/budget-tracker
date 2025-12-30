import { Budget, Transaction } from "../db/schema";
import {
  calculateBudgetUtilization,
  calculateCategoryTotalsForMonth,
  calculateMonthOverMonthDeltaByCategory,
  calculateMonthlyTotals,
  getLargestTransactionsForMonth,
  getTopMerchantsForMonth,
  MonthlyTotals,
  BudgetUtilization,
  MerchantTotal,
  CategoryDelta,
} from "./calculations";
import { getPreviousMonthKey } from "./monthHelpers";

export interface MonthlyAnalytics {
  monthKey: string;
  totals: MonthlyTotals;
  categoryTotals: Record<string, number>;
  budgetUtilization: BudgetUtilization[];
  largestTransactions: Transaction[];
  topMerchants: MerchantTotal[];
}

export function buildMonthlyAnalytics(
  transactions: Transaction[],
  budgets: Budget[],
  monthKey: string
): MonthlyAnalytics {
  return {
    monthKey,
    totals: calculateMonthlyTotals(transactions, monthKey),
    categoryTotals: calculateCategoryTotalsForMonth(transactions, monthKey, "expense"),
    budgetUtilization: calculateBudgetUtilization(budgets, transactions, monthKey),
    largestTransactions: getLargestTransactionsForMonth(transactions, monthKey, 5, "expense"),
    topMerchants: getTopMerchantsForMonth(transactions, monthKey, 5),
  };
}

export interface CategoryMoMAnalytics {
  currentMonth: string;
  previousMonth: string;
  deltas: Record<string, CategoryDelta>;
}

export function buildCategoryMoMAnalytics(
  transactions: Transaction[],
  currentMonthKey: string
): CategoryMoMAnalytics {
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  return {
    currentMonth: currentMonthKey,
    previousMonth: previousMonthKey,
    deltas: calculateMonthOverMonthDeltaByCategory(
      transactions,
      currentMonthKey,
      previousMonthKey
    ),
  };
}
