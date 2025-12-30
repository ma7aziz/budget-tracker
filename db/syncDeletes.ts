import { db, SyncTable } from "./schema";

export async function recordSyncDelete(table: SyncTable, id: string): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.syncDeletes.put({ table, id, deletedAt });
}

export async function clearSyncDelete(table: SyncTable, id: string): Promise<void> {
  await db.syncDeletes.delete([table, id]);
}

export async function listSyncDeletes(): Promise<Array<{ table: SyncTable; id: string }>> {
  const rows = await db.syncDeletes.toArray();
  return rows.map((row) => ({ table: row.table, id: row.id }));
}
