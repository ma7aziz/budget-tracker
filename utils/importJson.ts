import type { Table } from "dexie";
import {
  Account,
  Budget,
  Category,
  db,
  SCHEMA_VERSION,
  Settings,
  SETTINGS_ID,
  SettingsRecord,
  Transaction,
} from "../db/schema";
import { isValidDateString, isValidMonthKey } from "../services/monthHelpers";
import { ExportPayload } from "./exportJson";

export interface ImportReport {
  transactionsAdded: number;
  categoriesAdded: number;
  budgetsAdded: number;
  accountsAdded: number;
  settingsUpdated: boolean;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isString = (value: unknown): value is string => typeof value === "string";

const isInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === "string";

const assertCondition = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};

const validateTransaction = (transaction: Transaction): void => {
  assertCondition(isNonEmptyString(transaction.id), "Transaction id is required.");
  assertCondition(
    transaction.type === "expense" || transaction.type === "income",
    "Transaction type must be expense or income."
  );
  assertCondition(
    isInteger(transaction.amountCents) && transaction.amountCents >= 0,
    "Transaction amountCents must be a non-negative integer."
  );
  assertCondition(isValidDateString(transaction.date), "Transaction date is invalid.");
  assertCondition(isNonEmptyString(transaction.categoryId), "Transaction categoryId is required.");
  assertCondition(
    isNullableString(transaction.accountId),
    "Transaction accountId must be string or null."
  );
  assertCondition(
    isNullableString(transaction.merchant),
    "Transaction merchant must be string or null."
  );
  assertCondition(isNullableString(transaction.note), "Transaction note must be string or null.");
  assertCondition(isString(transaction.createdAt), "Transaction createdAt is required.");
  assertCondition(isString(transaction.updatedAt), "Transaction updatedAt is required.");
};

const validateCategory = (category: Category): void => {
  assertCondition(isNonEmptyString(category.id), "Category id is required.");
  assertCondition(isNonEmptyString(category.name), "Category name is required.");
  assertCondition(
    isNullableString(category.parentId),
    "Category parentId must be string or null."
  );
  assertCondition(isInteger(category.order), "Category order must be an integer.");
  assertCondition(isNullableString(category.color), "Category color must be string or null.");
};

const validateBudget = (budget: Budget): void => {
  assertCondition(isNonEmptyString(budget.id), "Budget id is required.");
  assertCondition(isValidMonthKey(budget.month), "Budget month is invalid.");
  assertCondition(isNonEmptyString(budget.categoryId), "Budget categoryId is required.");
  assertCondition(
    isInteger(budget.limitCents) && budget.limitCents >= 0,
    "Budget limitCents must be a non-negative integer."
  );
};

const validateAccount = (account: Account): void => {
  assertCondition(isNonEmptyString(account.id), "Account id is required.");
  assertCondition(isNonEmptyString(account.name), "Account name is required.");
  assertCondition(
    account.type === "cash" ||
      account.type === "bank" ||
      account.type === "card" ||
      account.type === "wallet",
    "Account type is invalid."
  );
};

const validateSettings = (settings: Settings): void => {
  assertCondition(isNonEmptyString(settings.currency), "Settings currency is required.");
  assertCondition(isNonEmptyString(settings.locale), "Settings locale is required.");
  assertCondition(isInteger(settings.weekStart), "Settings weekStart must be an integer.");
  assertCondition(isNonEmptyString(settings.theme), "Settings theme is required.");
};

export const validateExportPayload = (payload: ExportPayload): void => {
  assertCondition(
    payload.schemaVersion === SCHEMA_VERSION,
    `Unsupported schema version: ${payload.schemaVersion}`
  );

  assertCondition(Array.isArray(payload.transactions), "Transactions must be an array.");
  assertCondition(Array.isArray(payload.categories), "Categories must be an array.");
  assertCondition(Array.isArray(payload.budgets), "Budgets must be an array.");
  assertCondition(Array.isArray(payload.accounts), "Accounts must be an array.");
  assertCondition(
    payload.settings !== null && typeof payload.settings === "object",
    "Settings must be provided."
  );

  payload.transactions.forEach(validateTransaction);
  payload.categories.forEach(validateCategory);
  payload.budgets.forEach(validateBudget);
  payload.accounts.forEach(validateAccount);
  validateSettings(payload.settings);
};

const addWithoutDuplicates = async <T extends { id: string }>(
  table: Table<T, string>,
  items: T[]
): Promise<number> => {
  if (items.length === 0) {
    return 0;
  }

  const ids = items.map((item) => item.id);
  const existing = (await table.where("id").anyOf(ids).primaryKeys()) as string[];
  const existingSet = new Set(existing);

  const fresh = items.filter((item) => !existingSet.has(item.id));
  if (fresh.length > 0) {
    await table.bulkAdd(fresh);
  }

  return fresh.length;
};

export async function importJson(payload: ExportPayload): Promise<ImportReport> {
  validateExportPayload(payload);

  return db.transaction(
    "rw",
    [db.transactions, db.categories, db.budgets, db.accounts, db.settings],
    async () => {
      const transactionsAdded = await addWithoutDuplicates(
        db.transactions,
        payload.transactions
      );
      const categoriesAdded = await addWithoutDuplicates(
        db.categories,
        payload.categories
      );
      const budgetsAdded = await addWithoutDuplicates(db.budgets, payload.budgets);
      const accountsAdded = await addWithoutDuplicates(db.accounts, payload.accounts);

      const settingsRecord: SettingsRecord = { id: SETTINGS_ID, ...payload.settings };
      await db.settings.put(settingsRecord);

      return {
        transactionsAdded,
        categoriesAdded,
        budgetsAdded,
        accountsAdded,
        settingsUpdated: true,
      };
    }
  );
}
