import { db, generateId, RecurringCadence, RecurringTemplate } from "./schema";
import { recordSyncDelete } from "./syncDeletes";
import { isValidMonthKey } from "../services/monthHelpers";

export type NewRecurringTemplateInput = Omit<
  RecurringTemplate,
  "id" | "createdAt" | "updatedAt" | "lastPostedMonth"
> & {
  lastPostedMonth?: string | null;
};

const assertInteger = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
};

const assertDayOfMonth = (value: number) => {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error("dayOfMonth must be an integer between 1 and 31.");
  }
};

const assertCadence = (value: RecurringCadence) => {
  if (value !== "monthly") {
    throw new Error(`Unsupported cadence: ${value}`);
  }
};

export async function addRecurringTemplate(
  input: NewRecurringTemplateInput
): Promise<RecurringTemplate> {
  assertInteger(input.amountCents, "amountCents");
  assertDayOfMonth(input.dayOfMonth);
  assertCadence(input.cadence);
  if (input.lastPostedMonth && !isValidMonthKey(input.lastPostedMonth)) {
    throw new Error("lastPostedMonth is invalid.");
  }

  const now = new Date().toISOString();
  const template: RecurringTemplate = {
    ...input,
    id: generateId(),
    accountId: input.accountId ?? null,
    merchant: input.merchant ?? null,
    note: input.note ?? null,
    isActive: input.isActive ?? true,
    lastPostedMonth: input.lastPostedMonth ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.recurringTemplates.add(template);
  return template;
}

export async function getRecurringTemplate(id: string): Promise<RecurringTemplate | undefined> {
  return db.recurringTemplates.get(id);
}

export async function updateRecurringTemplate(
  id: string,
  updates: Partial<Omit<RecurringTemplate, "id" | "createdAt">>
): Promise<boolean> {
  const updateData: Partial<RecurringTemplate> = { updatedAt: new Date().toISOString() };

  if ("type" in updates && updates.type) {
    updateData.type = updates.type;
  }
  if ("amountCents" in updates && typeof updates.amountCents === "number") {
    assertInteger(updates.amountCents, "amountCents");
    updateData.amountCents = updates.amountCents;
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
  if ("cadence" in updates && updates.cadence) {
    assertCadence(updates.cadence);
    updateData.cadence = updates.cadence;
  }
  if ("dayOfMonth" in updates && typeof updates.dayOfMonth === "number") {
    assertDayOfMonth(updates.dayOfMonth);
    updateData.dayOfMonth = updates.dayOfMonth;
  }
  if ("isActive" in updates) {
    updateData.isActive = Boolean(updates.isActive);
  }
  if ("lastPostedMonth" in updates) {
    if (updates.lastPostedMonth && !isValidMonthKey(updates.lastPostedMonth)) {
      throw new Error("lastPostedMonth is invalid.");
    }
    updateData.lastPostedMonth = updates.lastPostedMonth ?? null;
  }

  const updated = await db.recurringTemplates.update(id, updateData);
  return updated > 0;
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  await db.recurringTemplates.delete(id);
  await recordSyncDelete("recurring_templates", id);
}

export async function listRecurringTemplates(): Promise<RecurringTemplate[]> {
  return db.recurringTemplates.toArray();
}
