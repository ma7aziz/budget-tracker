import { Account, db, generateId } from "./schema";

export type NewAccountInput = Omit<Account, "id">;

export async function addAccount(input: NewAccountInput): Promise<Account> {
  const account: Account = {
    ...input,
    id: generateId(),
  };

  await db.accounts.add(account);
  return account;
}

export async function getAccount(id: string): Promise<Account | undefined> {
  return db.accounts.get(id);
}

export async function updateAccount(
  id: string,
  updates: Partial<Omit<Account, "id">>
): Promise<boolean> {
  const updateData: Partial<Account> = {};

  if ("name" in updates && updates.name) {
    updateData.name = updates.name;
  }
  if ("type" in updates && updates.type) {
    updateData.type = updates.type;
  }

  const updated = await db.accounts.update(id, updateData);
  return updated > 0;
}

export async function deleteAccount(id: string): Promise<void> {
  await db.accounts.delete(id);
}

export async function listAccounts(): Promise<Account[]> {
  return db.accounts.orderBy("name").toArray();
}
