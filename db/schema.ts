import Dexie, { Table } from "dexie";

export const SCHEMA_VERSION = 4;

export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  date: string;
  categoryId: string;
  accountId: string | null;
  merchant: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  order: number;
  color: string | null;
  rolloverEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  month: string;
  categoryId: string;
  limitCents: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyBudget {
  id: string;
  month: string;
  limitCents: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AccountType = "cash" | "bank" | "card" | "wallet";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settings {
  currency: string;
  locale: string;
  weekStart: number;
  theme: string;
}

export interface SettingsRecord extends Settings {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SyncTable =
  | "transactions"
  | "categories"
  | "budgets"
  | "monthly_budgets"
  | "accounts"
  | "settings"
  | "recurring_templates";

export type RecurringCadence = "monthly";

export interface RecurringTemplate {
  id: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string;
  accountId: string | null;
  merchant: string | null;
  note: string | null;
  cadence: RecurringCadence;
  dayOfMonth: number;
  isActive: boolean;
  lastPostedMonth: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncDelete {
  table: SyncTable;
  id: string;
  deletedAt: string;
}

export const SETTINGS_ID = "settings";

export const defaultSettings: Settings = {
  currency: "EGP",
  locale: "en-EG",
  weekStart: 0,
  theme: "light",
};

export class BudgetTrackerDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  recurringTemplates!: Table<RecurringTemplate, string>;
  budgets!: Table<Budget, string>;
  monthlyBudgets!: Table<MonthlyBudget, string>;
  accounts!: Table<Account, string>;
  settings!: Table<SettingsRecord, string>;
  syncDeletes!: Table<SyncDelete, [string, string]>;

  constructor() {
    super("budget-tracker");

    this.version(SCHEMA_VERSION).stores({
      transactions:
        "id, date, type, categoryId, accountId, [type+date], [categoryId+date], [accountId+date]",
      categories: "id, parentId, order, name",
      recurringTemplates: "id, categoryId, isActive, cadence, dayOfMonth, lastPostedMonth",
      budgets: "id, month, categoryId, [month+categoryId]",
      monthlyBudgets: "id, month",
      accounts: "id, type, name",
      settings: "id",
      syncDeletes: "[table+id], table, id, deletedAt",
    });
  }
}

export const db = new BudgetTrackerDB();

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(16);
    (crypto as Crypto).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
      .slice(6, 8)
      .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  const fallback = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${fallback()}${fallback()}-${fallback()}-${fallback()}-${fallback()}-${fallback()}${fallback()}${fallback()}`;
}
