const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

const pad2 = (value: number) => value.toString().padStart(2, "0");

export function isValidDateString(date: string): boolean {
  if (!DATE_RE.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isValidMonthKey(monthKey: string): boolean {
  if (!MONTH_RE.test(monthKey)) {
    return false;
  }

  const [, month] = monthKey.split("-").map(Number);
  return month >= 1 && month <= 12;
}

export function toMonthKey(date: string): string {
  if (!isValidDateString(date)) {
    throw new Error(`Invalid date: ${date}`);
  }

  return date.slice(0, 7);
}

export function getMonthStart(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  return `${monthKey}-01`;
}

export function getMonthEnd(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${monthKey}-${pad2(lastDay)}`;
}

export function isDateInMonth(date: string, monthKey: string): boolean {
  if (!isValidDateString(date) || !isValidMonthKey(monthKey)) {
    return false;
  }

  return date.startsWith(`${monthKey}-`);
}

export function getPreviousMonthKey(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  const [year, month] = monthKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  return `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`;
}

export function getNextMonthKey(monthKey: string): string {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`);
  }

  const [year, month] = monthKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, 1));
  cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  return `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`;
}

export function listMonthKeysBetween(startMonthKey: string, endMonthKey: string): string[] {
  if (!isValidMonthKey(startMonthKey) || !isValidMonthKey(endMonthKey)) {
    throw new Error("Invalid month range provided.");
  }

  const [startYear, startMonth] = startMonthKey.split("-").map(Number);
  const [endYear, endMonth] = endMonthKey.split("-").map(Number);

  const start = new Date(Date.UTC(startYear, startMonth - 1, 1));
  const end = new Date(Date.UTC(endYear, endMonth - 1, 1));

  if (start > end) {
    return [];
  }

  const months: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    months.push(`${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return months;
}
