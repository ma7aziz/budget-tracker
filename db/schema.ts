import Dexie, { Table } from "dexie";

export const SCHEMA_VERSION = 1;

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
}

export interface Budget {
  id: string;
  month: string;
  categoryId: string;
  limitCents: number;
}

export type AccountType = "cash" | "bank" | "card" | "wallet";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
}

export interface Settings {
  currency: string;
  locale: string;
  weekStart: number;
  theme: string;
}

export interface SettingsRecord extends Settings {
  id: string;
}

export const SETTINGS_ID = "settings";

export const defaultSettings: Settings = {
  currency: "USD",
  locale: "en-US",
  weekStart: 0,
  theme: "light",
};

export class BudgetTrackerDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;
  accounts!: Table<Account, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("budget-tracker");

    this.version(SCHEMA_VERSION).stores({
      transactions:
        "id, date, type, categoryId, accountId, [type+date], [categoryId+date], [accountId+date]",
      categories: "id, parentId, order, name",
      budgets: "id, month, categoryId, [month+categoryId]",
      accounts: "id, type, name",
      settings: "id",
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
