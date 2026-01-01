"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { TopCategories, CategorySpending } from "@/components/dashboard/TopCategories";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { LoadingScreen } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";
import { getDataProvider } from "@/services/dataProvider";
import {
  Transaction,
  Category,
  Budget,
  Account,
  RecurringTemplate,
  TransactionType,
} from "@/db/schema";
import { formatCents, getCurrentMonthKey, formatMonthYear, parseCentsInput } from "@/utils/formatting";
import { getMonthEnd, getPreviousMonthKey } from "@/services/monthHelpers";
import { getTopMerchantsForMonth, MerchantTotal } from "@/services/calculations";

interface OverBudgetAlert {
  categoryId: string;
  categoryName: string;
  overByCents: number;
  spentCents: number;
  budgetCents: number;
  color: string | undefined;
}

interface UpcomingAlert {
  categoryId: string;
  categoryName: string;
  lastSpentCents: number;
  color: string | undefined;
}

interface DailySpendPoint {
  day: number;
  spentCents: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const currentMonthKey = getCurrentMonthKey();
  const lastMonthKey = getPreviousMonthKey(currentMonthKey);

  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
  const [changeSummary, setChangeSummary] = useState<{
    label: "Income" | "Expenses";
    deltaCents: number;
  } | null>(null);
  const [dailySpend, setDailySpend] = useState<DailySpendPoint[]>([]);
  const [topMerchants, setTopMerchants] = useState<MerchantTotal[]>([]);
  const [overBudgetAlerts, setOverBudgetAlerts] = useState<OverBudgetAlert[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<UpcomingAlert[]>([]);
  const [averageDailyMode, setAverageDailyMode] = useState<"elapsed" | "month">("elapsed");
  const [quickAddAmount, setQuickAddAmount] = useState("");
  const [quickAddCategoryId, setQuickAddCategoryId] = useState("");
  const [quickAddAccountId, setQuickAddAccountId] = useState("");
  const [quickAddMerchant, setQuickAddMerchant] = useState("");
  const [quickAddType, setQuickAddType] = useState<TransactionType>("expense");
  const [quickAddError, setQuickAddError] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const provider = getDataProvider();
      const comparisonMonthKey = getPreviousMonthKey(monthKey);

      const [txs, prevTxs, cats, buds, monthBudget, prevBuds, accs, templates] = await Promise.all([
        provider.transactions.listByMonth(monthKey),
        provider.transactions.listByMonth(comparisonMonthKey),
        provider.categories.list(),
        provider.budgets.listForMonth(monthKey),
        provider.monthlyBudgets.getForMonth(monthKey),
        provider.budgets.listForMonth(comparisonMonthKey),
        provider.accounts.list(),
        provider.recurringTemplates.list(),
      ]);

      setTransactions(txs);
      setCategories(cats);
      setBudgets(buds);
      setAccounts(accs);
      setRecurringTemplates(templates);

      const income = txs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amountCents, 0);

      const expenses = txs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amountCents, 0);

      setTotalIncome(income);
      setTotalExpenses(expenses);

      const previousIncome = prevTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amountCents, 0);

      const previousExpenses = prevTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amountCents, 0);

      const incomeDelta = income - previousIncome;
      const expenseDelta = expenses - previousExpenses;

      const highlight =
        Math.abs(expenseDelta) >= Math.abs(incomeDelta)
          ? { label: "Expenses" as const, deltaCents: expenseDelta }
          : { label: "Income" as const, deltaCents: incomeDelta };

      setChangeSummary(highlight);

      const categoryMap = new Map(
        cats.map((c) => [c.id, { ...c, rolloverEnabled: c.rolloverEnabled ?? false }])
      );

      const categorySpending = new Map<string, number>();
      txs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const current = categorySpending.get(t.categoryId) || 0;
          categorySpending.set(t.categoryId, current + t.amountCents);
        });

      const previousCategorySpending = new Map<string, number>();
      prevTxs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const current = previousCategorySpending.get(t.categoryId) || 0;
          previousCategorySpending.set(t.categoryId, current + t.amountCents);
        });

      const carryoverByCategory = new Map<string, number>();
      prevBuds.forEach((budget) => {
        const category = categoryMap.get(budget.categoryId);
        if (!category?.rolloverEnabled) {
          return;
        }
        const spent = previousCategorySpending.get(budget.categoryId) || 0;
        const remaining = budget.limitCents - spent;
        if (remaining > 0) {
          carryoverByCategory.set(budget.categoryId, remaining);
        }
      });

      const budgetMap = new Map(
        buds.map((budget) => {
          const category = categoryMap.get(budget.categoryId);
          const carryover = category?.rolloverEnabled
            ? carryoverByCategory.get(budget.categoryId) || 0
            : 0;
          return [budget.categoryId, budget.limitCents + carryover] as const;
        })
      );

      const effectiveBudgetTotal =
        monthBudget?.limitCents ??
        Array.from(budgetMap.values()).reduce((sum, value) => sum + value, 0);
      setTotalBudget(effectiveBudgetTotal);

      const topCats: CategorySpending[] = Array.from(categorySpending.entries())
        .map(([categoryId, amountCents]) => {
          const category = categoryMap.get(categoryId);
          const budgetCents = budgetMap.get(categoryId) || 0;
          const percentage = expenses > 0 ? (amountCents / expenses) * 100 : 0;

          return {
            categoryId,
            categoryName: category?.name || "Uncategorized",
            amountCents,
            budgetCents,
            percentage,
            color: category?.color || undefined,
          };
        })
        .sort((a, b) => b.amountCents - a.amountCents)
        .slice(0, 5);

      setTopCategories(topCats);

      const lastDay = Number(getMonthEnd(monthKey).slice(-2));
      const dailyPoints: DailySpendPoint[] = Array.from({ length: lastDay }, (_, index) => ({
        day: index + 1,
        spentCents: 0,
      }));

      txs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const day = Number(t.date.slice(8, 10));
          if (!Number.isNaN(day) && dailyPoints[day - 1]) {
            dailyPoints[day - 1].spentCents += t.amountCents;
          }
        });

      setDailySpend(dailyPoints);
      setTopMerchants(getTopMerchantsForMonth(txs, monthKey, 5));

      const overBudget = buds
        .map((budgetItem) => {
          const spent = categorySpending.get(budgetItem.categoryId) || 0;
          const effectiveLimit = budgetMap.get(budgetItem.categoryId) ?? budgetItem.limitCents;
          if (spent <= effectiveLimit) {
            return null;
          }
          const category = categoryMap.get(budgetItem.categoryId);
          return {
            categoryId: budgetItem.categoryId,
            categoryName: category?.name || "Uncategorized",
            overByCents: spent - effectiveLimit,
            spentCents: spent,
            budgetCents: effectiveLimit,
            color: category?.color || undefined,
          };
        })
        .filter((item): item is OverBudgetAlert => Boolean(item))
        .sort((a, b) => b.overByCents - a.overByCents)
        .slice(0, 3);

      const upcoming = buds
        .map((budgetItem) => {
          const spent = categorySpending.get(budgetItem.categoryId) || 0;
          const previousSpent = previousCategorySpending.get(budgetItem.categoryId) || 0;
          if (spent > 0 || previousSpent === 0) {
            return null;
          }
          const category = categoryMap.get(budgetItem.categoryId);
          return {
            categoryId: budgetItem.categoryId,
            categoryName: category?.name || "Uncategorized",
            lastSpentCents: previousSpent,
            color: category?.color || undefined,
          };
        })
        .filter((item): item is UpcomingAlert => Boolean(item))
        .slice(0, 3);

      setOverBudgetAlerts(overBudget);
      setUpcomingAlerts(upcoming);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!quickAddCategoryId && categories.length > 0) {
      setQuickAddCategoryId(categories[0].id);
    }
  }, [categories, quickAddCategoryId]);

  function handleQuickAdd() {
    router.push("/transactions/new");
  }

  function handleTransactionClick(transaction: Transaction) {
    router.push(`/transactions/${transaction.id}`);
  }

  function getTemplateDate(month: string, dayOfMonth: number): string {
    const lastDay = Number(getMonthEnd(month).slice(-2));
    const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
    return `${month}-${String(day).padStart(2, "0")}`;
  }

  async function handleQuickAddSubmit(event: FormEvent) {
    event.preventDefault();
    setQuickAddError("");

    const amountCents = parseCentsInput(quickAddAmount);
    if (amountCents === null || amountCents <= 0) {
      setQuickAddError("Enter a valid amount.");
      return;
    }
    if (!quickAddCategoryId) {
      setQuickAddError("Choose a category.");
      return;
    }

    try {
      setQuickAddSaving(true);
      const provider = getDataProvider();
      const today = new Date().toISOString().slice(0, 10);
      await provider.transactions.add({
        type: quickAddType,
        amountCents,
        date: today,
        categoryId: quickAddCategoryId,
        accountId: quickAddAccountId || null,
        merchant: quickAddMerchant.trim() || null,
        note: null,
      });
      setQuickAddAmount("");
      setQuickAddMerchant("");
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to quick add transaction:", error);
      setQuickAddError("Quick add failed. Try again.");
    } finally {
      setQuickAddSaving(false);
    }
  }

  async function handlePostTemplate(template: RecurringTemplate) {
    if (!template.isActive || template.lastPostedMonth === monthKey) {
      return;
    }

    try {
      const provider = getDataProvider();
      const date = getTemplateDate(monthKey, template.dayOfMonth);
      await provider.transactions.add({
        type: template.type,
        amountCents: template.amountCents,
        date,
        categoryId: template.categoryId,
        accountId: template.accountId ?? null,
        merchant: template.merchant ?? null,
        note: template.note ?? null,
      });
      await provider.recurringTemplates.update(template.id, {
        lastPostedMonth: monthKey,
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to post recurring template:", error);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const budgetRemaining = totalBudget - totalExpenses;
  const budgetUsedPercent = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;
  const overBudget = totalBudget > 0 && totalExpenses > totalBudget;
  const daysInMonth = Number(getMonthEnd(monthKey).slice(-2));
  const isCurrentMonth = monthKey === currentMonthKey;
  const daysElapsed = isCurrentMonth ? Math.min(new Date().getDate(), daysInMonth) : daysInMonth;
  const effectiveAverageMode = isCurrentMonth ? averageDailyMode : "month";
  const averageDailySpendCents =
    (effectiveAverageMode === "elapsed" ? daysElapsed : daysInMonth) > 0
      ? Math.round(
          totalExpenses /
            (effectiveAverageMode === "elapsed" ? daysElapsed : daysInMonth)
        )
      : 0;
  const averageDailyLabel =
    effectiveAverageMode === "elapsed" ? "Based on days so far" : "Across the full month";
  const projectedSpendCents =
    isCurrentMonth && daysElapsed > 0
      ? Math.round((totalExpenses / daysElapsed) * daysInMonth)
      : totalExpenses;
  const projectedRemainingCents = totalBudget > 0 ? totalBudget - projectedSpendCents : 0;
  const chartTooltipStyle = {
    backgroundColor: "var(--tooltip-bg)",
    border: "1px solid var(--tooltip-border)",
    borderRadius: "0.5rem",
    color: "var(--tooltip-text)",
  };
  const chartTooltipLabelStyle = { color: "var(--tooltip-text)" };
  const chartTooltipItemStyle = { color: "var(--tooltip-text)" };
  const budgetChartData =
    totalBudget > 0
      ? [
          { name: "Spent", value: Math.min(totalExpenses, totalBudget) },
          { name: "Remaining", value: Math.max(totalBudget - totalExpenses, 0) },
        ]
      : [];

  const changeIsPositive = changeSummary
    ? changeSummary.label === "Income"
      ? changeSummary.deltaCents >= 0
      : changeSummary.deltaCents <= 0
    : true;
  const changeDirection = changeSummary && changeSummary.deltaCents >= 0 ? "up" : "down";
  const changeColor = changeIsPositive ? "text-[var(--positive)]" : "text-[var(--danger)]";
  const quickAddCategoryOptions: SelectOption[] = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const quickAddAccountOptions: SelectOption[] = [
    { value: "", label: "No account" },
    ...accounts.map((account) => ({
      value: account.id,
      label: account.name,
    })),
  ];
  const activeTemplates = recurringTemplates.filter((template) => template.isActive);
  const pendingTemplates = activeTemplates.filter(
    (template) => template.lastPostedMonth !== monthKey
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatMonthYear(monthKey)}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Overview of your spending for this period
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={monthKey === currentMonthKey ? "primary" : "secondary"}
              onClick={() => setMonthKey(currentMonthKey)}
            >
              This Month
            </Button>
            <Button
              size="sm"
              variant={monthKey === lastMonthKey ? "primary" : "secondary"}
              onClick={() => setMonthKey(lastMonthKey)}
            >
              Last Month
            </Button>
          </div>
        </div>

        <Card className="md:hidden">
          <CardHeader>
            <CardTitle>Widget Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                <p className="text-[var(--muted)]">Income</p>
                <p className="mt-1 font-semibold text-[var(--positive)]">
                  {formatCents(totalIncome)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                <p className="text-[var(--muted)]">Expenses</p>
                <p className="mt-1 font-semibold text-[var(--danger)]">
                  {formatCents(totalExpenses)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                <p className="text-[var(--muted)]">Net</p>
                <p className="mt-1 font-semibold text-[var(--ink)]">
                  {formatCents(totalIncome - totalExpenses)}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-3">
                <p className="text-[var(--muted)]">Budget Left</p>
                <p
                  className={`mt-1 font-semibold ${
                    budgetRemaining >= 0 ? "text-[var(--positive)]" : "text-[var(--danger)]"
                  }`}
                >
                  {formatCents(budgetRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Add</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickAddSubmit} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={quickAddType === "expense" ? "primary" : "secondary"}
                  onClick={() => setQuickAddType("expense")}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={quickAddType === "income" ? "primary" : "secondary"}
                  onClick={() => setQuickAddType("income")}
                >
                  Income
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={quickAddAmount}
                  onChange={(e) => setQuickAddAmount(e.target.value)}
                />
                <Select
                  label="Category"
                  options={quickAddCategoryOptions}
                  value={quickAddCategoryId}
                  onChange={(e) => setQuickAddCategoryId(e.target.value)}
                  placeholder="Select category"
                />
                <Select
                  label="Account"
                  options={quickAddAccountOptions}
                  value={quickAddAccountId}
                  onChange={(e) => setQuickAddAccountId(e.target.value)}
                />
                <Input
                  label="Merchant"
                  placeholder="Optional"
                  value={quickAddMerchant}
                  onChange={(e) => setQuickAddMerchant(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {quickAddError ? (
                  <p className="text-sm text-[var(--danger)]">{quickAddError}</p>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Adds today&apos;s transaction.
                  </span>
                )}
                <Button type="submit" disabled={quickAddSaving}>
                  {quickAddSaving ? "Saving..." : "Add Transaction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <MonthlySummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalBudget={totalBudget}
          averageDailySpendCents={averageDailySpendCents}
          averageDailySpendLabel={averageDailyLabel}
          averageDailySpendMode={effectiveAverageMode}
          showAverageDailyToggle={isCurrentMonth}
          onAverageDailySpendModeChange={setAverageDailyMode}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent>
              {totalBudget > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
                      <PieChart>
                        <Pie
                          data={budgetChartData}
                          innerRadius={42}
                          outerRadius={60}
                          dataKey="value"
                          stroke="none"
                        >
                          {budgetChartData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                index === 0
                                  ? overBudget
                                    ? "var(--danger)"
                                    : "var(--accent)"
                                  : "var(--surface-strong)"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCents(Number(value))}
                          contentStyle={chartTooltipStyle}
                          labelStyle={chartTooltipLabelStyle}
                          itemStyle={chartTooltipItemStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {budgetUsedPercent}% used
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Spent {formatCents(totalExpenses)} of {formatCents(totalBudget)}
                    </p>
                    {isCurrentMonth && totalExpenses > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Projected spend {formatCents(projectedSpendCents)}
                        {totalBudget > 0 && (
                          <span className="ml-2">
                            (
                            {projectedRemainingCents >= 0
                              ? `${formatCents(projectedRemainingCents)} left`
                              : `${formatCents(Math.abs(projectedRemainingCents))} over`}
                            )
                          </span>
                        )}
                      </p>
                    )}
                    <p
                      className={`text-sm font-medium ${
                        overBudget ? "text-[var(--danger)]" : "text-[var(--positive)]"
                      }`}
                    >
                      {overBudget
                        ? `Over by ${formatCents(Math.abs(budgetRemaining))}`
                        : `${formatCents(budgetRemaining)} remaining`}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set a monthly budget to track progress.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biggest Change</CardTitle>
            </CardHeader>
            <CardContent>
              {changeSummary ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {changeDirection === "up" ? (
                      <ArrowUpRight className={`${changeColor}`} size={20} />
                    ) : (
                      <ArrowDownRight className={`${changeColor}`} size={20} />
                    )}
                    <p className={`text-lg font-semibold ${changeColor}`}>
                      {changeSummary.label} {changeSummary.deltaCents >= 0 ? "up" : "down"}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCents(Math.abs(changeSummary.deltaCents))}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Compared to last month</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add transactions to see changes over time.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySpend.length > 0 ? (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={120}>
                    <LineChart data={dailySpend}>
                      <Line
                        type="monotone"
                        dataKey="spentCents"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Tooltip
                        formatter={(value) => formatCents(Number(value))}
                        labelFormatter={(label) => `Day ${label}`}
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipLabelStyle}
                        itemStyle={chartTooltipItemStyle}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No expenses recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCategories categories={topCategories} />
          <RecentTransactions
            transactions={recentTransactions}
            categories={categoryNameMap}
            onTransactionClick={handleTransactionClick}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTemplates.length > 0 ? (
                <div className="space-y-3">
                  {activeTemplates.map((template) => {
                    const isPosted = template.lastPostedMonth === monthKey;
                    const category = categories.find((cat) => cat.id === template.categoryId);
                    return (
                      <div key={template.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {template.merchant || category?.name || "Recurring"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Day {template.dayOfMonth} • {template.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCents(template.amountCents)}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isPosted}
                            onClick={() => handlePostTemplate(template)}
                          >
                            {isPosted ? "Posted" : "Post"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {pendingTemplates.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      All templates posted for this month.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No active templates yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <AlertTriangle size={16} />
                    Over Budget
                  </div>
                  {overBudgetAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {overBudgetAlerts.map((alert) => (
                        <div
                          key={alert.categoryId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {alert.color && (
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: alert.color }}
                              />
                            )}
                            <span className="text-gray-700 dark:text-gray-300">
                              {alert.categoryName}
                            </span>
                          </div>
                          <span className="font-semibold text-[var(--danger)]">
                            {formatCents(alert.overByCents)} over
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No over-budget categories.</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CalendarClock size={16} />
                    Upcoming Categories
                  </div>
                  {upcomingAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingAlerts.map((alert) => (
                        <div
                          key={alert.categoryId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {alert.color && (
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: alert.color }}
                              />
                            )}
                            <span className="text-gray-700 dark:text-gray-300">
                              {alert.categoryName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Last month {formatCents(alert.lastSpentCents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming categories.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Merchants</CardTitle>
            </CardHeader>
            <CardContent>
              {topMerchants.length > 0 ? (
                <div className="space-y-3">
                  {topMerchants.map((merchant) => (
                    <div key={merchant.merchant} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{merchant.merchant}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCents(merchant.totalCents)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No merchant data for this month.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FloatingActionButton
        icon={<Plus size={24} />}
        onClick={handleQuickAdd}
        aria-label="Add transaction"
      />
    </AppLayout>
  );
}
