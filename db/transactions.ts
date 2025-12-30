import { db, generateId, Transaction } from "./schema";
import { getMonthEnd, getMonthStart, isValidDateString } from "../services/monthHelpers";
import { recordSyncDelete } from "./syncDeletes";

export type NewTransactionInput = Omit<Transaction, "id" | "createdAt" | "updatedAt">;

const assertInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
};

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  if (!isValidDateString(input.date)) {
    throw new Error(`Invalid date format: ${input.date}`);
  }
  assertInteger(input.amountCents, "amountCents");

  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...input,
    id: generateId(),
    accountId: input.accountId ?? null,
    merchant: input.merchant ?? null,
    note: input.note ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.transactions.add(transaction);
  return transaction;
}

export async function getTransaction(id: string): Promise<Transaction | undefined> {
  return db.transactions.get(id);
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt">>
): Promise<boolean> {
  const now = new Date().toISOString();
  const updateData: Partial<Transaction> = { updatedAt: now };

  if ("type" in updates && updates.type) {
    updateData.type = updates.type;
  }
  if ("amountCents" in updates && typeof updates.amountCents === "number") {
    assertInteger(updates.amountCents, "amountCents");
    updateData.amountCents = updates.amountCents;
  }
  if ("date" in updates && updates.date) {
    if (!isValidDateString(updates.date)) {
      throw new Error(`Invalid date format: ${updates.date}`);
    }
    updateData.date = updates.date;
  }
  if ("categoryId" in updates && updates.categoryId) {
    updateData.categoryId = updates.categoryId;
  }
  if ("accountId" in updates) {
    updateData.accountId = updates.accountId ?? null;
  }
  if ("merchant" in updates) {
    updateData.merchant = updates.merchant ?? null;
  }
  if ("note" in updates) {
    updateData.note = updates.note ?? null;
  }

  const updated = await db.transactions.update(id, updateData);
  return updated > 0;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
  await recordSyncDelete("transactions", id);
}

export async function listTransactions(): Promise<Transaction[]> {
  return db.transactions.toArray();
}

export async function listTransactionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new Error("Invalid date range provided.");
  }

  return db.transactions.where("date").between(startDate, endDate, true, true).toArray();
}

export async function listTransactionsByMonth(monthKey: string): Promise<Transaction[]> {
  const start = getMonthStart(monthKey);
  const end = getMonthEnd(monthKey);
  return listTransactionsByDateRange(start, end);
}

export async function listTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  return db.transactions.where("accountId").equals(accountId).toArray();
}

export async function listTransactionsByCategory(categoryId: string): Promise<Transaction[]> {
  return db.transactions.where("categoryId").equals(categoryId).toArray();
}
