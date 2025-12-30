import { db, defaultSettings, Settings, SETTINGS_ID, SettingsRecord } from "./schema";

export async function getSettings(): Promise<Settings> {
  const record = await db.settings.get(SETTINGS_ID);
  if (!record) {
    const now = new Date().toISOString();
    const newRecord: SettingsRecord = {
      id: SETTINGS_ID,
      ...defaultSettings,
      createdAt: now,
      updatedAt: now,
    };
    await db.settings.put(newRecord);
    return { ...defaultSettings };
  }

  const { currency, locale, weekStart, theme } = record;
  return { currency, locale, weekStart, theme };
}

export async function setSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const existing = await db.settings.get(SETTINGS_ID);
  const merged: Settings = {
    currency: updates.currency ?? current.currency,
    locale: updates.locale ?? current.locale,
    weekStart: updates.weekStart ?? current.weekStart,
    theme: updates.theme ?? current.theme,
  };

  const now = new Date().toISOString();
  await db.settings.put({
    id: SETTINGS_ID,
    ...merged,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  return merged;
}

export async function resetSettings(): Promise<Settings> {
  const now = new Date().toISOString();
  await db.settings.put({
    id: SETTINGS_ID,
    ...defaultSettings,
    createdAt: now,
    updatedAt: now,
  });
  return { ...defaultSettings };
}
