import type { Session } from "@supabase/supabase-js";
import { ANON_DB_NAME, buildUserDbName, setActiveDbName } from "../db/schema";

export async function applyUserScope(userId: string | null): Promise<void> {
  if (!userId) {
    await setActiveDbName(ANON_DB_NAME);
    return;
  }

  await setActiveDbName(buildUserDbName(userId));
}

export async function applySessionScope(session: Session | null): Promise<void> {
  await applyUserScope(session?.user?.id ?? null);
}

