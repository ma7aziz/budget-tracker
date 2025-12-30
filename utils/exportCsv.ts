import { db, Transaction } from "../db/schema";

export interface CsvOptions {
  includeHeader?: boolean;
}

const headerColumns = [
  "id",
  "type",
  "amountCents",
  "date",
  "categoryId",
  "accountId",
  "merchant",
  "note",
  "createdAt",
  "updatedAt",
];

const escapeCsvValue = (value: string | number | null | undefined): string => {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export function exportTransactionsCsv(
  transactions: Transaction[],
  options: CsvOptions = {}
): string {
  const includeHeader = options.includeHeader !== false;
  const rows: string[] = [];

  if (includeHeader) {
    rows.push(headerColumns.join(","));
  }

  for (const transaction of transactions) {
    const row = [
      transaction.id,
      transaction.type,
      transaction.amountCents,
      transaction.date,
      transaction.categoryId,
      transaction.accountId,
      transaction.merchant,
      transaction.note,
      transaction.createdAt,
      transaction.updatedAt,
    ].map(escapeCsvValue);

    rows.push(row.join(","));
  }

  return rows.join("\n");
}

export async function exportTransactionsCsvFromDb(
  options: CsvOptions = {}
): Promise<string> {
  const transactions = await db.transactions.toArray();
  return exportTransactionsCsv(transactions, options);
}
