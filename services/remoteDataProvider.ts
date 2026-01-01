import type {
  DataProvider,
  TransactionRepository,
  CategoryRepository,
  BudgetRepository,
  MonthlyBudgetRepository,
  AccountRepository,
  RecurringTemplateRepository,
  SettingsRepository,
} from "./dataProvider";
import type { ExportPayload } from "../utils/exportJson";
import type { ImportReport } from "../utils/importJson";

const notImplemented = async <T>(label: string): Promise<T> => {
  throw new Error(`Remote data provider not configured: ${label}`);
};

const makeTransactions = (): TransactionRepository => ({
  add: () => notImplemented("transactions.add"),
  get: (id) => notImplemented(`transactions.get:${id}`),
  update: (id) => notImplemented(`transactions.update:${id}`),
  delete: (id) => notImplemented(`transactions.delete:${id}`),
  list: () => notImplemented("transactions.list"),
  listByDateRange: () => notImplemented("transactions.listByDateRange"),
  listByMonth: (monthKey) => notImplemented(`transactions.listByMonth:${monthKey}`),
  listByAccount: (accountId) => notImplemented(`transactions.listByAccount:${accountId}`),
  listByCategory: (categoryId) => notImplemented(`transactions.listByCategory:${categoryId}`),
});

const makeCategories = (): CategoryRepository => ({
  add: () => notImplemented("categories.add"),
  get: (id) => notImplemented(`categories.get:${id}`),
  update: (id) => notImplemented(`categories.update:${id}`),
  delete: (id) => notImplemented(`categories.delete:${id}`),
  list: () => notImplemented("categories.list"),
  updateOrder: (id) => notImplemented(`categories.updateOrder:${id}`),
});

const makeBudgets = (): BudgetRepository => ({
  add: () => notImplemented("budgets.add"),
  get: (id) => notImplemented(`budgets.get:${id}`),
  getForMonthCategory: (monthKey, categoryId) =>
    notImplemented(`budgets.getForMonthCategory:${monthKey}:${categoryId}`),
  upsertForMonth: (monthKey, categoryId) =>
    notImplemented(`budgets.upsertForMonth:${monthKey}:${categoryId}`),
  update: (id) => notImplemented(`budgets.update:${id}`),
  delete: (id) => notImplemented(`budgets.delete:${id}`),
  list: () => notImplemented("budgets.list"),
  listForMonth: (monthKey) => notImplemented(`budgets.listForMonth:${monthKey}`),
});

const makeMonthlyBudgets = (): MonthlyBudgetRepository => ({
  add: () => notImplemented("monthlyBudgets.add"),
  get: (id) => notImplemented(`monthlyBudgets.get:${id}`),
  getForMonth: (monthKey) => notImplemented(`monthlyBudgets.getForMonth:${monthKey}`),
  upsertForMonth: (monthKey) => notImplemented(`monthlyBudgets.upsertForMonth:${monthKey}`),
  update: (id) => notImplemented(`monthlyBudgets.update:${id}`),
  delete: (id) => notImplemented(`monthlyBudgets.delete:${id}`),
  list: () => notImplemented("monthlyBudgets.list"),
  listForMonth: (monthKey) => notImplemented(`monthlyBudgets.listForMonth:${monthKey}`),
});

const makeAccounts = (): AccountRepository => ({
  add: () => notImplemented("accounts.add"),
  get: (id) => notImplemented(`accounts.get:${id}`),
  update: (id) => notImplemented(`accounts.update:${id}`),
  delete: (id) => notImplemented(`accounts.delete:${id}`),
  list: () => notImplemented("accounts.list"),
});

const makeRecurringTemplates = (): RecurringTemplateRepository => ({
  add: () => notImplemented("recurringTemplates.add"),
  get: (id) => notImplemented(`recurringTemplates.get:${id}`),
  update: (id) => notImplemented(`recurringTemplates.update:${id}`),
  delete: (id) => notImplemented(`recurringTemplates.delete:${id}`),
  list: () => notImplemented("recurringTemplates.list"),
});

const makeSettings = (): SettingsRepository => ({
  get: () => notImplemented("settings.get"),
  set: () => notImplemented("settings.set"),
  reset: () => notImplemented("settings.reset"),
});

export function createRemoteDataProvider(): DataProvider {
  return {
    kind: "remote",
    transactions: makeTransactions(),
    categories: makeCategories(),
    budgets: makeBudgets(),
    monthlyBudgets: makeMonthlyBudgets(),
    accounts: makeAccounts(),
    recurringTemplates: makeRecurringTemplates(),
    settings: makeSettings(),
    exportJson: () => notImplemented<ExportPayload>("exportJson"),
    importJson: () => notImplemented<ImportReport>("importJson"),
    exportCsv: () => notImplemented<string>("exportCsv"),
  };
}
