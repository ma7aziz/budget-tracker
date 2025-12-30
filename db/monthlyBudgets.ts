import { MonthlyBudget, db, generateId } from "./schema";
import { isValidMonthKey } from "../services/monthHelpers";
import { recordSyncDelete } from "./syncDeletes";

export type NewMonthlyBudgetInput = Omit<MonthlyBudget, "id" | "createdAt" | "updatedAt">;

const assertInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
};

export async function addMonthlyBudget(input: NewMonthlyBudgetInput): Promise<MonthlyBudget> {
  if (!isValidMonthKey(input.month)) {
    throw new Error(`Invalid month key: ${input.month}`);
  }
  assertInteger(input.limitCents, "limitCents");

  const now = new Date().toISOString();
  const monthlyBudget: MonthlyBudget = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  await db.monthlyBudgets.add(monthlyBudget);
  return monthlyBudget;
}

export async function getMonthlyBudget(id: string): Promise<MonthlyBudget | undefined> {
  return db.monthlyBudgets.get(id);
}

export async function getMonthlyBudgetForMonth(monthKey: string): Promise<MonthlyBudget | undefined> {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  return db.monthlyBudgets.where("month").equals(monthKey).first();
}

export async function upsertMonthlyBudgetForMonth(
  monthKey: string,
  limitCents: number
): Promise<MonthlyBudget> {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  assertInteger(limitCents, "limitCents");

  const existing = await getMonthlyBudgetForMonth(monthKey);
  if (existing) {
    const updated: MonthlyBudget = {
      ...existing,
      limitCents,
      updatedAt: new Date().toISOString(),
    };
    await db.monthlyBudgets.put(updated);
    return updated;
  }

  const now = new Date().toISOString();
  const monthlyBudget: MonthlyBudget = {
    id: generateId(),
    month: monthKey,
    limitCents,
    createdAt: now,
    updatedAt: now,
  };
  await db.monthlyBudgets.add(monthlyBudget);
  return monthlyBudget;
}

export async function updateMonthlyBudget(
  id: string,
  updates: Partial<Omit<MonthlyBudget, "id">>
): Promise<boolean> {
  const updateData: Partial<MonthlyBudget> = {};

  if ("month" in updates && updates.month) {
    if (!isValidMonthKey(updates.month)) {
      throw new Error(`Invalid month key: ${updates.month}`);
    }
    updateData.month = updates.month;
  }
  if ("limitCents" in updates && typeof updates.limitCents === "number") {
    assertInteger(updates.limitCents, "limitCents");
    updateData.limitCents = updates.limitCents;
  }
  updateData.updatedAt = new Date().toISOString();

  const updated = await db.monthlyBudgets.update(id, updateData);
  return updated > 0;
}

export async function deleteMonthlyBudget(id: string): Promise<void> {
  await db.monthlyBudgets.delete(id);
  await recordSyncDelete("monthly_budgets", id);
}

export async function listMonthlyBudgets(): Promise<MonthlyBudget[]> {
  return db.monthlyBudgets.toArray();
}

export async function listMonthlyBudgetsForMonth(monthKey: string): Promise<MonthlyBudget[]> {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }
  return db.monthlyBudgets.where("month").equals(monthKey).toArray();
}
