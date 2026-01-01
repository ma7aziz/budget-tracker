import {
  db,
  SETTINGS_ID,
  generateId,
  type Account,
  type Budget,
  type Category,
  type MonthlyBudget,
  type RecurringTemplate,
  type Transaction,
  type SyncTable,
} from "../db/schema";
import { clearSyncDelete, listSyncDeletes } from "../db/syncDeletes";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { getCurrentSession, getCurrentUserId } from "./supabaseAuth";

type RemoteTransaction = {
  id: string;
  user_id: string;
  type: "expense" | "income";
  amount_cents: number;
  date: string;
  category_id: string;
  account_id: string | null;
  merchant: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type RemoteCategory = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  order: number;
  color: string | null;
  rollover_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type RemoteBudget = {
  id: string;
  user_id: string;
  month: string;
  category_id: string;
  limit_cents: number;
  created_at: string;
  updated_at: string;
};

type RemoteMonthlyBudget = {
  id: string;
  user_id: string;
  month: string;
  limit_cents: number;
  created_at: string;
  updated_at: string;
};

type RemoteAccount = {
  id: string;
  user_id: string;
  name: string;
  type: "cash" | "bank" | "card" | "wallet";
  created_at: string;
  updated_at: string;
};

type RemoteSettings = {
  id: string;
  user_id: string;
  currency: string;
  locale: string;
  week_start: number;
  theme: string;
  created_at: string;
  updated_at: string;
};

type RemoteRecurringTemplate = {
  id: string;
  user_id: string;
  type: "expense" | "income";
  amount_cents: number;
  category_id: string;
  account_id: string | null;
  merchant: string | null;
  note: string | null;
  cadence: "monthly";
  day_of_month: number;
  is_active: boolean;
  last_posted_month: string | null;
  created_at: string;
  updated_at: string;
};

const isOnline = (): boolean =>
  typeof navigator !== "undefined" ? navigator.onLine : false;

const toEpoch = (value?: string | null): number => {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const ensureTimestamp = (value?: string): string =>
  value && value.length > 0 ? value : new Date().toISOString();

const mapTransactionToRemote = (transaction: Transaction, userId: string): RemoteTransaction => ({
  id: transaction.id,
  user_id: userId,
  type: transaction.type,
  amount_cents: transaction.amountCents,
  date: transaction.date,
  category_id: transaction.categoryId,
  account_id: transaction.accountId ?? null,
  merchant: transaction.merchant ?? null,
  note: transaction.note ?? null,
  created_at: ensureTimestamp(transaction.createdAt),
  updated_at: ensureTimestamp(transaction.updatedAt),
});

const mapRemoteToTransaction = (row: RemoteTransaction): Transaction => ({
  id: row.id,
  type: row.type,
  amountCents: row.amount_cents,
  date: row.date,
  categoryId: row.category_id,
  accountId: row.account_id,
  merchant: row.merchant,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCategoryToRemote = (category: Category, userId: string): RemoteCategory => ({
  id: category.id,
  user_id: userId,
  name: category.name,
  parent_id: category.parentId ?? null,
  order: category.order,
  color: category.color ?? null,
  rollover_enabled: category.rolloverEnabled ?? false,
  created_at: ensureTimestamp(category.createdAt),
  updated_at: ensureTimestamp(category.updatedAt),
});

const mapRemoteToCategory = (row: RemoteCategory): Category => ({
  id: row.id,
  name: row.name,
  parentId: row.parent_id,
  order: row.order,
  color: row.color,
  rolloverEnabled: row.rollover_enabled ?? false,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapBudgetToRemote = (budget: Budget, userId: string): RemoteBudget => ({
  id: budget.id,
  user_id: userId,
  month: budget.month,
  category_id: budget.categoryId,
  limit_cents: budget.limitCents,
  created_at: ensureTimestamp(budget.createdAt),
  updated_at: ensureTimestamp(budget.updatedAt),
});

const mapRemoteToBudget = (row: RemoteBudget): Budget => ({
  id: row.id,
  month: row.month,
  categoryId: row.category_id,
  limitCents: row.limit_cents,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapMonthlyBudgetToRemote = (
  budget: MonthlyBudget,
  userId: string
): RemoteMonthlyBudget => ({
  id: budget.id,
  user_id: userId,
  month: budget.month,
  limit_cents: budget.limitCents,
  created_at: ensureTimestamp(budget.createdAt),
  updated_at: ensureTimestamp(budget.updatedAt),
});

const mapRemoteToMonthlyBudget = (row: RemoteMonthlyBudget): MonthlyBudget => ({
  id: row.id,
  month: row.month,
  limitCents: row.limit_cents,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAccountToRemote = (account: Account, userId: string): RemoteAccount => ({
  id: account.id,
  user_id: userId,
  name: account.name,
  type: account.type,
  created_at: ensureTimestamp(account.createdAt),
  updated_at: ensureTimestamp(account.updatedAt),
});

const mapRemoteToAccount = (row: RemoteAccount): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSettingsToRemote = (
  settings: { currency: string; locale: string; weekStart: number; theme: string; createdAt?: string; updatedAt?: string },
  userId: string,
  existingId?: string
): RemoteSettings => ({
  id: existingId ?? generateId(),
  user_id: userId,
  currency: settings.currency,
  locale: settings.locale,
  week_start: settings.weekStart,
  theme: settings.theme,
  created_at: ensureTimestamp(settings.createdAt),
  updated_at: ensureTimestamp(settings.updatedAt),
});

const mapRemoteToSettings = (row: RemoteSettings) => ({
  id: SETTINGS_ID,
  currency: row.currency,
  locale: row.locale,
  weekStart: row.week_start,
  theme: row.theme,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapRecurringTemplateToRemote = (
  template: RecurringTemplate,
  userId: string
): RemoteRecurringTemplate => ({
  id: template.id,
  user_id: userId,
  type: template.type,
  amount_cents: template.amountCents,
  category_id: template.categoryId,
  account_id: template.accountId ?? null,
  merchant: template.merchant ?? null,
  note: template.note ?? null,
  cadence: template.cadence,
  day_of_month: template.dayOfMonth,
  is_active: template.isActive,
  last_posted_month: template.lastPostedMonth ?? null,
  created_at: ensureTimestamp(template.createdAt),
  updated_at: ensureTimestamp(template.updatedAt),
});

const mapRemoteToRecurringTemplate = (row: RemoteRecurringTemplate): RecurringTemplate => ({
  id: row.id,
  type: row.type,
  amountCents: row.amount_cents,
  categoryId: row.category_id,
  accountId: row.account_id,
  merchant: row.merchant,
  note: row.note,
  cadence: row.cadence,
  dayOfMonth: row.day_of_month,
  isActive: row.is_active,
  lastPostedMonth: row.last_posted_month,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

async function fetchRemote<T>(table: string, userId: string, columns: string): Promise<T[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(table).select(columns).eq("user_id", userId);
  if (error) {
    throw error;
  }
  return (data ?? []) as T[];
}

async function fetchRemoteTransactions(userId: string): Promise<RemoteTransaction[]> {
  const supabase = getSupabaseClient();
  const columns =
    "id,user_id,type,amount_cents,date,category_id,account_id,merchant,note,created_at,updated_at";
  const pageSize = 500;
  const results: RemoteTransaction[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select(columns)
      .eq("user_id", userId)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as RemoteTransaction[];
    results.push(...page);

    if (page.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return results;
}

async function mergeTransactions(remote: RemoteTransaction[], local: Transaction[]): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: Transaction[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToTransaction(row));
    }
  }

  if (updates.length > 0) {
    await db.transactions.bulkPut(updates);
  }
}

async function mergeCategories(remote: RemoteCategory[], local: Category[]): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: Category[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToCategory(row));
    }
  }

  if (updates.length > 0) {
    await db.categories.bulkPut(updates);
  }
}

async function mergeBudgets(remote: RemoteBudget[], local: Budget[]): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: Budget[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToBudget(row));
    }
  }

  if (updates.length > 0) {
    await db.budgets.bulkPut(updates);
  }
}

async function mergeMonthlyBudgets(
  remote: RemoteMonthlyBudget[],
  local: MonthlyBudget[]
): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: MonthlyBudget[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToMonthlyBudget(row));
    }
  }

  if (updates.length > 0) {
    await db.monthlyBudgets.bulkPut(updates);
  }
}

async function mergeAccounts(remote: RemoteAccount[], local: Account[]): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: Account[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToAccount(row));
    }
  }

  if (updates.length > 0) {
    await db.accounts.bulkPut(updates);
  }
}

async function mergeRecurringTemplates(
  remote: RemoteRecurringTemplate[],
  local: RecurringTemplate[]
): Promise<void> {
  const localMap = new Map(local.map((item) => [item.id, item]));
  const updates: RecurringTemplate[] = [];

  for (const row of remote) {
    const localItem = localMap.get(row.id);
    if (!localItem || toEpoch(row.updated_at) > toEpoch(localItem.updatedAt)) {
      updates.push(mapRemoteToRecurringTemplate(row));
    }
  }

  if (updates.length > 0) {
    await db.recurringTemplates.bulkPut(updates);
  }
}

async function mergeSettings(remote: RemoteSettings[], local: { updatedAt?: string } | undefined): Promise<void> {
  if (remote.length === 0) {
    return;
  }

  const latest = remote.sort((a, b) => toEpoch(b.updated_at) - toEpoch(a.updated_at))[0];
  if (!local || toEpoch(latest.updated_at) > toEpoch(local.updatedAt)) {
    await db.settings.put(mapRemoteToSettings(latest));
  }
}

async function pushTransactions(userId: string, remote: RemoteTransaction[], local: Transaction[]): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteTransaction[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapTransactionToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("transactions").upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushCategories(userId: string, remote: RemoteCategory[], local: Category[]): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteCategory[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapCategoryToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("categories").upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushBudgets(userId: string, remote: RemoteBudget[], local: Budget[]): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteBudget[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapBudgetToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("budgets").upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushMonthlyBudgets(
  userId: string,
  remote: RemoteMonthlyBudget[],
  local: MonthlyBudget[]
): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteMonthlyBudget[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapMonthlyBudgetToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("monthly_budgets")
      .upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushAccounts(userId: string, remote: RemoteAccount[], local: Account[]): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteAccount[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapAccountToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("accounts").upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushRecurringTemplates(
  userId: string,
  remote: RemoteRecurringTemplate[],
  local: RecurringTemplate[]
): Promise<void> {
  const remoteMap = new Map(remote.map((row) => [row.id, row]));
  const payload: RemoteRecurringTemplate[] = [];

  for (const item of local) {
    const remoteItem = remoteMap.get(item.id);
    if (!remoteItem || toEpoch(item.updatedAt) > toEpoch(remoteItem.updated_at)) {
      payload.push(mapRecurringTemplateToRemote(item, userId));
    }
  }

  if (payload.length > 0) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("recurring_templates")
      .upsert(payload, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }
}

async function pushSettings(userId: string, remote: RemoteSettings[], local: { currency: string; locale: string; weekStart: number; theme: string; createdAt?: string; updatedAt?: string }): Promise<void> {
  const existing = remote[0];
  const payload = mapSettingsToRemote(local, userId, existing?.id);
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "user_id" });
  if (error) {
    throw error;
  }
}

async function pushDeletes(): Promise<void> {
  const deletions = await listSyncDeletes();
  if (deletions.length === 0) {
    return;
  }

  const grouped = new Map<string, string[]>();
  for (const item of deletions) {
    const list = grouped.get(item.table) ?? [];
    list.push(item.id);
    grouped.set(item.table, list);
  }

  const supabase = getSupabaseClient();
  for (const [table, ids] of grouped.entries()) {
    const { error } = await supabase.from(table).delete().in("id", ids);
    if (error) {
      throw error;
    }
    await Promise.all(ids.map((id) => clearSyncDelete(table as SyncTable, id)));
  }
}

export async function syncAll(): Promise<void> {
  if (!isSupabaseConfigured() || !isOnline()) {
    return;
  }

  const session = await getCurrentSession();
  if (!session?.access_token) {
    return;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return;
  }

  const [
    remoteTransactions,
    remoteCategories,
    remoteBudgets,
    remoteMonthlyBudgets,
    remoteAccounts,
    remoteRecurringTemplates,
    remoteSettings,
  ] = await Promise.all([
    fetchRemoteTransactions(userId),
    fetchRemote<RemoteCategory>(
      "categories",
      userId,
      "id,user_id,name,parent_id,order,color,rollover_enabled,created_at,updated_at"
    ),
    fetchRemote<RemoteBudget>(
      "budgets",
      userId,
      "id,user_id,month,category_id,limit_cents,created_at,updated_at"
    ),
    fetchRemote<RemoteMonthlyBudget>(
      "monthly_budgets",
      userId,
      "id,user_id,month,limit_cents,created_at,updated_at"
    ),
    fetchRemote<RemoteAccount>(
      "accounts",
      userId,
      "id,user_id,name,type,created_at,updated_at"
    ),
    fetchRemote<RemoteRecurringTemplate>(
      "recurring_templates",
      userId,
      "id,user_id,type,amount_cents,category_id,account_id,merchant,note,cadence,day_of_month,is_active,last_posted_month,created_at,updated_at"
    ),
    fetchRemote<RemoteSettings>(
      "settings",
      userId,
      "id,user_id,currency,locale,week_start,theme,created_at,updated_at"
    ),
  ]);

  const [
    localTransactions,
    localCategories,
    localBudgets,
    localMonthlyBudgets,
    localAccounts,
    localRecurringTemplates,
    localSettings,
  ] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.monthlyBudgets.toArray(),
    db.accounts.toArray(),
    db.recurringTemplates.toArray(),
    db.settings.get(SETTINGS_ID),
  ]);

  await mergeTransactions(remoteTransactions, localTransactions);
  await mergeCategories(remoteCategories, localCategories);
  await mergeBudgets(remoteBudgets, localBudgets);
  await mergeMonthlyBudgets(remoteMonthlyBudgets, localMonthlyBudgets);
  await mergeAccounts(remoteAccounts, localAccounts);
  await mergeRecurringTemplates(remoteRecurringTemplates, localRecurringTemplates);
  await mergeSettings(remoteSettings, localSettings);

  await pushCategories(userId, remoteCategories, localCategories);
  await pushAccounts(userId, remoteAccounts, localAccounts);
  await pushBudgets(userId, remoteBudgets, localBudgets);
  await pushMonthlyBudgets(userId, remoteMonthlyBudgets, localMonthlyBudgets);
  await pushTransactions(userId, remoteTransactions, localTransactions);
  await pushRecurringTemplates(userId, remoteRecurringTemplates, localRecurringTemplates);

  const currentSettings = await db.settings.get(SETTINGS_ID);
  if (currentSettings) {
    await pushSettings(userId, remoteSettings, currentSettings);
  }

  await pushDeletes();
}

export function triggerSync(): void {
  syncAll().catch((error) => {
    // Swallow sync errors to keep UI responsive, but keep them visible for debugging.
    const maybeError = error as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const message = maybeError?.message;
    const code = maybeError?.code;
    if (typeof message === "string" && message.includes("No API key found in request")) {
      console.warn(
        "Supabase sync failed: missing API key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY (no quotes/spaces), rebuild/reload the app, and if installed as a PWA clear site data/unregister the service worker."
      );
      console.warn(error);
      return;
    }

    if (
      typeof message === "string" &&
      (message.toLowerCase().includes("permission denied") ||
        message.toLowerCase().includes("row level security") ||
        message.toLowerCase().includes("rls") ||
        code === "42501")
    ) {
      console.warn(
        "Supabase sync failed: access denied. Ensure you ran `supabase/schema.sql` (RLS policies + GRANTs), and verify the failing request includes an `Authorization: Bearer <jwt>` header (signed-in session)."
      );
      console.warn(error);
      return;
    }

    console.warn("Supabase sync failed:", error);
  });
}

export function registerOnlineSync(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = () => triggerSync();
  window.addEventListener("online", handler);

  return () => {
    window.removeEventListener("online", handler);
  };
}
