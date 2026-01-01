import { getDataProvider } from "./dataProvider";
import type { Category, Account } from "../db/schema";
import type { NewTransactionInput } from "../db/transactions";

const pad2 = (value: number) => value.toString().padStart(2, "0");

const toDateString = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const toMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const buildDate = (base: Date, day: number): string => {
  const date = new Date(base.getFullYear(), base.getMonth(), day);
  return toDateString(date);
};

const adjustAmount = (base: number, index: number): number => {
  const variance = index * 200;
  const amount = index % 2 === 0 ? base + variance : base - variance;
  return Math.max(100, Math.round(amount));
};

export async function ensureDemoData(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const provider = getDataProvider();
  if (provider.kind !== "local") {
    return false;
  }

  const [existingTransactions, existingCategories] = await Promise.all([
    provider.transactions.list(),
    provider.categories.list(),
  ]);

  if (existingTransactions.length > 0 || existingCategories.length > 0) {
    return false;
  }

  const accounts: Account[] = [];
  accounts.push(await provider.accounts.add({ name: "Main Checking", type: "bank" }));
  accounts.push(await provider.accounts.add({ name: "Rewards Card", type: "card" }));
  accounts.push(await provider.accounts.add({ name: "Cash Wallet", type: "cash" }));

  const categorySeeds: Array<Pick<Category, "name" | "color">> = [
    { name: "Salary", color: "#0f6b5a" },
    { name: "Housing", color: "#2563eb" },
    { name: "Groceries", color: "#16a34a" },
    { name: "Dining", color: "#f97316" },
    { name: "Transport", color: "#0ea5e9" },
    { name: "Utilities", color: "#a855f7" },
    { name: "Entertainment", color: "#e11d48" },
    { name: "Health", color: "#14b8a6" },
    { name: "Shopping", color: "#facc15" },
  ];

  const categories: Category[] = [];
  for (let index = 0; index < categorySeeds.length; index += 1) {
    const seed = categorySeeds[index];
    categories.push(
      await provider.categories.add({
        name: seed.name,
        color: seed.color,
        parentId: null,
        order: index + 1,
        rolloverEnabled: false,
      })
    );
  }

  const accountByName = new Map(accounts.map((account) => [account.name, account]));
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  const monthKey = toMonthKey(new Date());
  await provider.monthlyBudgets.upsertForMonth(monthKey, 300000);
  const budgetPairs: Array<[string, number]> = [
    ["Housing", 120000],
    ["Groceries", 50000],
    ["Dining", 25000],
    ["Transport", 20000],
    ["Utilities", 18000],
    ["Entertainment", 15000],
    ["Health", 10000],
    ["Shopping", 20000],
  ];

  for (const [categoryName, limitCents] of budgetPairs) {
    const category = categoryByName.get(categoryName);
    if (!category) {
      continue;
    }
    await provider.budgets.add({
      month: monthKey,
      categoryId: category.id,
      limitCents,
    });
  }

  const transactions: NewTransactionInput[] = [];
  const now = new Date();

  for (let i = 0; i < 6; i += 1) {
    const monthBase = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const checking = accountByName.get("Main Checking");
    const card = accountByName.get("Rewards Card");
    const cash = accountByName.get("Cash Wallet");
    const salary = categoryByName.get("Salary");
    const housing = categoryByName.get("Housing");
    const groceries = categoryByName.get("Groceries");
    const dining = categoryByName.get("Dining");
    const transport = categoryByName.get("Transport");
    const utilities = categoryByName.get("Utilities");
    const entertainment = categoryByName.get("Entertainment");
    const health = categoryByName.get("Health");
    const shopping = categoryByName.get("Shopping");

    if (!salary || !housing || !groceries || !dining || !transport || !utilities || !entertainment || !health || !shopping) {
      continue;
    }

    const incomeAmount = adjustAmount(450000, i);
    transactions.push({
      type: "income",
      amountCents: incomeAmount,
      date: buildDate(monthBase, 1),
      categoryId: salary.id,
      accountId: checking?.id ?? null,
      merchant: "Acme Corp",
      note: "Monthly salary",
    });

    if (i === 0) {
      transactions.push({
        type: "income",
        amountCents: 75000,
        date: buildDate(monthBase, 15),
        categoryId: salary.id,
        accountId: checking?.id ?? null,
        merchant: "Side Project",
        note: "Freelance payout",
      });
    }

    transactions.push({
      type: "expense",
      amountCents: 120000,
      date: buildDate(monthBase, 2),
      categoryId: housing.id,
      accountId: checking?.id ?? null,
      merchant: "Sunrise Apartments",
      note: "Rent",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(8900, i),
      date: buildDate(monthBase, 6),
      categoryId: groceries.id,
      accountId: card?.id ?? null,
      merchant: "Fresh Market",
      note: "Groceries",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(3200, i),
      date: buildDate(monthBase, 9),
      categoryId: dining.id,
      accountId: card?.id ?? null,
      merchant: "Noodle House",
      note: "Lunch",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(2800, i),
      date: buildDate(monthBase, 11),
      categoryId: transport.id,
      accountId: cash?.id ?? null,
      merchant: "Metro",
      note: "Transit card",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(9700, i),
      date: buildDate(monthBase, 12),
      categoryId: utilities.id,
      accountId: checking?.id ?? null,
      merchant: "City Energy",
      note: "Electric bill",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(1299, i),
      date: buildDate(monthBase, 14),
      categoryId: entertainment.id,
      accountId: card?.id ?? null,
      merchant: "StreamBox",
      note: "Subscription",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(4200, i),
      date: buildDate(monthBase, 18),
      categoryId: health.id,
      accountId: card?.id ?? null,
      merchant: "Wellness Pharmacy",
      note: "Pharmacy",
    });

    transactions.push({
      type: "expense",
      amountCents: adjustAmount(5600, i),
      date: buildDate(monthBase, 21),
      categoryId: shopping.id,
      accountId: card?.id ?? null,
      merchant: "Market Hub",
      note: "Household items",
    });
  }

  for (const transaction of transactions) {
    await provider.transactions.add(transaction);
  }

  return true;
}
