import { db, defaultSettings, Settings, SETTINGS_ID, SettingsRecord } from "./schema";

export async function getSettings(): Promise<Settings> {
  const record = await db.settings.get(SETTINGS_ID);
  if (!record) {
    const newRecord: SettingsRecord = { id: SETTINGS_ID, ...defaultSettings };
    await db.settings.put(newRecord);
    return { ...defaultSettings };
  }

  const { currency, locale, weekStart, theme } = record;
  return { currency, locale, weekStart, theme };
}

export async function setSettings(updates: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged: Settings = {
    currency: updates.currency ?? current.currency,
    locale: updates.locale ?? current.locale,
    weekStart: updates.weekStart ?? current.weekStart,
    theme: updates.theme ?? current.theme,
  };

  await db.settings.put({ id: SETTINGS_ID, ...merged });
  return merged;
}

export async function resetSettings(): Promise<Settings> {
  await db.settings.put({ id: SETTINGS_ID, ...defaultSettings });
  return { ...defaultSettings };
}
