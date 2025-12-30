import { Budget, db, generateId } from "./schema";
import { recordSyncDelete } from "./syncDeletes";
import { isValidMonthKey } from "../services/monthHelpers";

export type NewBudgetInput = Omit<Budget, "id" | "createdAt" | "updatedAt">;

const assertInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
};

export async function addBudget(input: NewBudgetInput): Promise<Budget> {
  if (!isValidMonthKey(input.month)) {
    throw new Error(`Invalid month key: ${input.month}`);
  }
  assertInteger(input.limitCents, "limitCents");

  const now = new Date().toISOString();
  const budget: Budget = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.budgets.add(budget);
  return budget;
}

export async function getBudget(id: string): Promise<Budget | undefined> {
  return db.budgets.get(id);
}

export async function getBudgetForMonthCategory(
  monthKey: string,
  categoryId: string
): Promise<Budget | undefined> {
  return db.budgets.where("[month+categoryId]").equals([monthKey, categoryId]).first();
}

export async function upsertBudgetForMonth(
  monthKey: string,
  categoryId: string,
  limitCents: number
): Promise<Budget> {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  assertInteger(limitCents, "limitCents");

  const existing = await getBudgetForMonthCategory(monthKey, categoryId);
  if (existing) {
    const updated: Budget = { ...existing, limitCents, updatedAt: new Date().toISOString() };
    await db.budgets.put(updated);
    return updated;
  }

  const now = new Date().toISOString();
  const budget: Budget = {
    id: generateId(),
    month: monthKey,
    categoryId,
    limitCents,
    createdAt: now,
    updatedAt: now,
  };
  await db.budgets.add(budget);
  return budget;
}

export async function updateBudget(
  id: string,
  updates: Partial<Omit<Budget, "id">>
): Promise<boolean> {
  const updateData: Partial<Budget> = {};

  if ("month" in updates && updates.month) {
    if (!isValidMonthKey(updates.month)) {
      throw new Error(`Invalid month key: ${updates.month}`);
    }
    updateData.month = updates.month;
  }
  if ("categoryId" in updates && updates.categoryId) {
    updateData.categoryId = updates.categoryId;
  }
  if ("limitCents" in updates && typeof updates.limitCents === "number") {
    assertInteger(updates.limitCents, "limitCents");
    updateData.limitCents = updates.limitCents;
  }
  updateData.updatedAt = new Date().toISOString();

  const updated = await db.budgets.update(id, updateData);
  return updated > 0;
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id);
  await recordSyncDelete("budgets", id);
}

export async function listBudgets(): Promise<Budget[]> {
  return db.budgets.toArray();
}

export async function listBudgetsForMonth(monthKey: string): Promise<Budget[]> {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  return db.budgets.where("month").equals(monthKey).toArray();
}
