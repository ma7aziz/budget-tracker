import { Category, db, generateId } from "./schema";
import { recordSyncDelete } from "./syncDeletes";

export type NewCategoryInput = Omit<Category, "id" | "createdAt" | "updatedAt">;

export async function addCategory(input: NewCategoryInput): Promise<Category> {
  const now = new Date().toISOString();
  const category: Category = {
    ...input,
    id: generateId(),
    parentId: input.parentId ?? null,
    color: input.color ?? null,
    rolloverEnabled: input.rolloverEnabled ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await db.categories.add(category);
  return category;
}

export async function getCategory(id: string): Promise<Category | undefined> {
  return db.categories.get(id);
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id">>
): Promise<boolean> {
  const updateData: Partial<Category> = {};

  if ("name" in updates && updates.name) {
    updateData.name = updates.name;
  }
  if ("parentId" in updates) {
    updateData.parentId = updates.parentId ?? null;
  }
  if ("order" in updates && typeof updates.order === "number") {
    updateData.order = updates.order;
  }
  if ("color" in updates) {
    updateData.color = updates.color ?? null;
  }
  if ("rolloverEnabled" in updates) {
    updateData.rolloverEnabled = Boolean(updates.rolloverEnabled);
  }
  updateData.updatedAt = new Date().toISOString();

  const updated = await db.categories.update(id, updateData);
  return updated > 0;
}

export async function deleteCategory(id: string): Promise<void> {
  await db.categories.delete(id);
  await recordSyncDelete("categories", id);
}

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy("order").toArray();
}

export async function updateCategoryOrder(id: string, order: number): Promise<boolean> {
  const updated = await db.categories.update(id, {
    order,
    updatedAt: new Date().toISOString(),
  });
  return updated > 0;
}
