import type { Transaction, Category, Budget, Account, Settings } from "../db/schema";
import type { NewTransactionInput } from "../db/transactions";
import type { ExportPayload } from "../utils/exportJson";
import type { ImportReport } from "../utils/importJson";
import type { CsvOptions } from "../utils/exportCsv";
import { createLocalDataProvider } from "./localDataProvider";
import { createRemoteDataProvider } from "./remoteDataProvider";

export type DataProviderKind = "local" | "remote";

export interface TransactionRepository {
  add(input: NewTransactionInput): Promise<Transaction>;
  get(id: string): Promise<Transaction | undefined>;
  update(id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>): Promise<boolean>;
  delete(id: string): Promise<void>;
  list(): Promise<Transaction[]>;
  listByDateRange(startDate: string, endDate: string): Promise<Transaction[]>;
  listByMonth(monthKey: string): Promise<Transaction[]>;
  listByAccount(accountId: string): Promise<Transaction[]>;
  listByCategory(categoryId: string): Promise<Transaction[]>;
}

export interface CategoryRepository {
  add(input: Omit<Category, "id">): Promise<Category>;
  get(id: string): Promise<Category | undefined>;
  update(id: string, updates: Partial<Omit<Category, "id">>): Promise<boolean>;
  delete(id: string): Promise<void>;
  list(): Promise<Category[]>;
  updateOrder(id: string, order: number): Promise<boolean>;
}

export interface BudgetRepository {
  add(input: Omit<Budget, "id">): Promise<Budget>;
  get(id: string): Promise<Budget | undefined>;
  getForMonthCategory(monthKey: string, categoryId: string): Promise<Budget | undefined>;
  upsertForMonth(monthKey: string, categoryId: string, limitCents: number): Promise<Budget>;
  update(id: string, updates: Partial<Omit<Budget, "id">>): Promise<boolean>;
  delete(id: string): Promise<void>;
  list(): Promise<Budget[]>;
  listForMonth(monthKey: string): Promise<Budget[]>;
}

export interface AccountRepository {
  add(input: Omit<Account, "id">): Promise<Account>;
  get(id: string): Promise<Account | undefined>;
  update(id: string, updates: Partial<Omit<Account, "id">>): Promise<boolean>;
  delete(id: string): Promise<void>;
  list(): Promise<Account[]>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  set(updates: Partial<Settings>): Promise<Settings>;
  reset(): Promise<Settings>;
}

export interface DataProvider {
  kind: DataProviderKind;
  transactions: TransactionRepository;
  categories: CategoryRepository;
  budgets: BudgetRepository;
  accounts: AccountRepository;
  settings: SettingsRepository;
  exportJson(): Promise<ExportPayload>;
  importJson(payload: ExportPayload): Promise<ImportReport>;
  exportCsv(options?: CsvOptions): Promise<string>;
}

export function getDefaultDataProviderKind(): DataProviderKind {
  const override = process.env.NEXT_PUBLIC_DATA_PROVIDER;
  if (override === "remote") {
    return "remote";
  }

  return "local";
}

let cachedProvider: DataProvider | null = null;

export function getDataProvider(kind: DataProviderKind = getDefaultDataProviderKind()): DataProvider {
  if (cachedProvider && cachedProvider.kind === kind) {
    return cachedProvider;
  }

  cachedProvider = kind === "remote" ? createRemoteDataProvider() : createLocalDataProvider();
  return cachedProvider;
}
