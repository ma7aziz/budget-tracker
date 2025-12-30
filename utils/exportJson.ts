import { Account, Budget, Category, db, SCHEMA_VERSION, Transaction } from "../db/schema";
import { getSettings } from "../db/settings";
import type { Settings } from "../db/schema";

export interface ExportPayload {
  schemaVersion: number;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  settings: Settings;
}

export async function exportJson(): Promise<ExportPayload> {
  const [transactions, categories, budgets, accounts, settings] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.accounts.toArray(),
    getSettings(),
  ]);

  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    categories,
    budgets,
    accounts,
    settings,
  };
}
