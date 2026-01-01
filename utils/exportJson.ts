import {
  Account,
  Budget,
  Category,
  MonthlyBudget,
  RecurringTemplate,
  db,
  SCHEMA_VERSION,
  Transaction,
} from "../db/schema";
import { getSettings } from "../db/settings";
import type { Settings } from "../db/schema";

export interface ExportPayload {
  schemaVersion: number;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  recurringTemplates: RecurringTemplate[];
  budgets: Budget[];
  monthlyBudgets: MonthlyBudget[];
  accounts: Account[];
  settings: Settings;
}

export async function exportJson(): Promise<ExportPayload> {
  const [
    transactions,
    categories,
    recurringTemplates,
    budgets,
    monthlyBudgets,
    accounts,
    settings,
  ] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.recurringTemplates.toArray(),
    db.budgets.toArray(),
    db.monthlyBudgets.toArray(),
    db.accounts.toArray(),
    getSettings(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    recurringTemplates,
    budgets,
    monthlyBudgets,
    accounts,
    settings,
  };
}
