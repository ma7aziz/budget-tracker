import { Budget, Transaction, TransactionType } from "../db/schema";
import { isDateInMonth } from "./monthHelpers";

export interface MonthlyTotals {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export function calculateMonthlyTotals(
  transactions: Transaction[],
  monthKey?: string
): MonthlyTotals {
  let incomeCents = 0;
  let expenseCents = 0;

  for (const transaction of transactions) {
    if (monthKey && !isDateInMonth(transaction.date, monthKey)) {
      continue;
    }

    if (transaction.type === "income") {
      incomeCents += transaction.amountCents;
    } else {
      expenseCents += transaction.amountCents;
    }
  }

  return {
    incomeCents,
    expenseCents,
    netCents: incomeCents - expenseCents,
  };
}

export function calculateCategoryTotalsForMonth(
  transactions: Transaction[],
  monthKey: string,
  type: TransactionType | "all" = "expense"
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const transaction of transactions) {
    if (!isDateInMonth(transaction.date, monthKey)) {
      continue;
    }

    if (type !== "all" && transaction.type !== type) {
      continue;
    }

    const delta =
      type === "all" && transaction.type === "expense"
        ? -transaction.amountCents
        : transaction.amountCents;

    totals[transaction.categoryId] = (totals[transaction.categoryId] ?? 0) + delta;
  }

  return totals;
}

export interface BudgetUtilization {
  budgetId: string;
  categoryId: string;
  limitCents: number;
  spentCents: number;
  remainingCents: number;
  utilizationPct: number;
}

export function calculateBudgetUtilization(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string
): BudgetUtilization[] {
  const spendingByCategory = calculateCategoryTotalsForMonth(
    transactions,
    monthKey,
    "expense"
  );

  return budgets
    .filter((budget) => budget.month === monthKey)
    .map((budget) => {
      const spentCents = spendingByCategory[budget.categoryId] ?? 0;
      const remainingCents = budget.limitCents - spentCents;
      const utilizationPct = budget.limitCents > 0
        ? Math.floor((spentCents * 100) / budget.limitCents)
        : 0;

      return {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        limitCents: budget.limitCents,
        spentCents,
        remainingCents,
        utilizationPct,
      };
    });
}

export interface CategoryDelta {
  categoryId: string;
  currentCents: number;
  previousCents: number;
  deltaCents: number;
}

export function calculateMonthOverMonthDeltaByCategory(
  transactions: Transaction[],
  currentMonthKey: string,
  previousMonthKey: string
): Record<string, CategoryDelta> {
  const currentTotals = calculateCategoryTotalsForMonth(
    transactions,
    currentMonthKey,
    "expense"
  );
  const previousTotals = calculateCategoryTotalsForMonth(
    transactions,
    previousMonthKey,
    "expense"
  );

  const categoryIds = new Set([
    ...Object.keys(currentTotals),
    ...Object.keys(previousTotals),
  ]);

  const deltas: Record<string, CategoryDelta> = {};
  for (const categoryId of categoryIds) {
    const currentCents = currentTotals[categoryId] ?? 0;
    const previousCents = previousTotals[categoryId] ?? 0;
    deltas[categoryId] = {
      categoryId,
      currentCents,
      previousCents,
      deltaCents: currentCents - previousCents,
    };
  }

  return deltas;
}

export function getLargestTransactionsForMonth(
  transactions: Transaction[],
  monthKey: string,
  limit = 5,
  type?: TransactionType
): Transaction[] {
  const filtered = transactions.filter((transaction) => {
    if (!isDateInMonth(transaction.date, monthKey)) {
      return false;
    }

    return type ? transaction.type === type : true;
  });

  return filtered
    .slice()
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, limit);
}

export interface MerchantTotal {
  merchant: string;
  totalCents: number;
  transactionCount: number;
}

export function getTopMerchantsForMonth(
  transactions: Transaction[],
  monthKey: string,
  limit = 5
): MerchantTotal[] {
  const totals = new Map<string, MerchantTotal>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    if (!isDateInMonth(transaction.date, monthKey)) {
      continue;
    }

    const merchantName = (transaction.merchant ?? "").trim();
    if (!merchantName) {
      continue;
    }

    const key = merchantName.toLowerCase();
    const existing = totals.get(key) ?? {
      merchant: merchantName,
      totalCents: 0,
      transactionCount: 0,
    };

    existing.totalCents += transaction.amountCents;
    existing.transactionCount += 1;
    totals.set(key, existing);
  }

  return Array.from(totals.values())
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, limit);
}
