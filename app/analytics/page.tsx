"use client";

import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select, SelectOption } from "@/components/ui/Select";
import { LoadingScreen } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { getDataProvider } from "@/services/dataProvider";
import { Transaction, Category, Budget } from "@/db/schema";
import { formatCents, getCurrentMonthKey, formatMonthYear } from "@/utils/formatting";
import { getPreviousMonthKey } from "@/services/monthHelpers";

interface CategoryData {
  name: string;
  valueCents: number;
  color: string;
  percentage: number;
  [key: string]: any;
}

interface MonthlyData {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
}

interface CategoryTrendPoint {
  month: string;
  valueCents: number;
}

interface CategoryTrend {
  categoryId: string;
  name: string;
  color: string;
  data: CategoryTrendPoint[];
}

interface CategoryDeltaRow {
  categoryId: string;
  name: string;
  currentCents: number;
  previousCents: number;
  deltaCents: number;
  percentChange: number | null;
}

interface WeekdayData {
  label: string;
  amountCents: number;
}

interface MerchantData {
  name: string;
  amountCents: number;
}

interface BudgetUtilizationData {
  categoryId: string;
  name: string;
  spentCents: number;
  budgetCents: number;
  percent: number;
  color: string | null;
}

const COLORS = [
  "#0f6b5a",
  "#14b8a0",
  "#2dd4b8",
  "#5fe9ce",
  "#99f6e0",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [largestTransactions, setLargestTransactions] = useState<Transaction[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
  const [momDeltas, setMomDeltas] = useState<CategoryDeltaRow[]>([]);
  const [weekdayData, setWeekdayData] = useState<WeekdayData[]>([]);
  const [merchantData, setMerchantData] = useState<MerchantData[]>([]);
  const [budgetUtilization, setBudgetUtilization] = useState<BudgetUtilizationData[]>([]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const chartTooltipStyle = {
    backgroundColor: "var(--tooltip-bg)",
    border: "1px solid var(--tooltip-border)",
    borderRadius: "0.5rem",
    color: "var(--tooltip-text)",
  };
  const chartTooltipLabelStyle = { color: "var(--tooltip-text)" };
  const chartTooltipItemStyle = { color: "var(--tooltip-text)" };
  const chartLegendStyle = { paddingTop: "20px", color: "var(--muted)" };

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const provider = getDataProvider();
      const previousMonthKey = getPreviousMonthKey(monthKey);

      const [txs, cats, buds, prevBuds] = await Promise.all([
        provider.transactions.list(),
        provider.categories.list(),
        provider.budgets.listForMonth(monthKey),
        provider.budgets.listForMonth(previousMonthKey),
      ]);

      setTransactions(txs);
      setCategories(cats);
      setBudgets(buds);

      const monthTxs = txs.filter((t) => t.date.startsWith(monthKey));
      const previousMonthTxs = txs.filter((t) => t.date.startsWith(previousMonthKey));

      const categoryMap = new Map(
        cats.map((c) => [c.id, { ...c, rolloverEnabled: c.rolloverEnabled ?? false }])
      );
      const categorySpending = new Map<string, number>();
      const previousCategorySpending = new Map<string, number>();

      let income = 0;
      let expenses = 0;

      monthTxs.forEach((t) => {
        if (t.type === "income") {
          income += t.amountCents;
        } else {
          expenses += t.amountCents;
          const current = categorySpending.get(t.categoryId) || 0;
          categorySpending.set(t.categoryId, current + t.amountCents);
        }
      });

      previousMonthTxs
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

      setTotalIncome(income);
      setTotalExpenses(expenses);

      const catData: CategoryData[] = Array.from(categorySpending.entries())
        .map(([categoryId, amount], index) => {
          const category = categoryMap.get(categoryId);
          const percentage = expenses > 0 ? (amount / expenses) * 100 : 0;

          return {
            name: category?.name || "Uncategorized",
            valueCents: amount,
            color: category?.color || COLORS[index % COLORS.length],
            percentage,
          };
        })
        .sort((a, b) => b.valueCents - a.valueCents);

      setCategoryData(catData);

      const monthKeys: string[] = [];
      let cursor = monthKey;
      for (let i = 0; i < 6; i += 1) {
        monthKeys.push(cursor);
        cursor = getPreviousMonthKey(cursor);
      }
      monthKeys.reverse();

      const monthSet = new Set(monthKeys);
      const monthlyTotals = new Map<string, { income: number; expenses: number }>();
      monthKeys.forEach((key) => monthlyTotals.set(key, { income: 0, expenses: 0 }));

      const monthlyCategoryTotals = new Map<string, Map<string, number>>();
      monthKeys.forEach((key) => monthlyCategoryTotals.set(key, new Map()));

      txs.forEach((t) => {
        const tMonthKey = t.date.substring(0, 7);
        if (!monthSet.has(tMonthKey)) {
          return;
        }

        const totals = monthlyTotals.get(tMonthKey);
        if (!totals) {
          return;
        }

        if (t.type === "income") {
          totals.income += t.amountCents;
        } else {
          totals.expenses += t.amountCents;
          const categoryTotals = monthlyCategoryTotals.get(tMonthKey);
          if (categoryTotals) {
            categoryTotals.set(
              t.categoryId,
              (categoryTotals.get(t.categoryId) || 0) + t.amountCents
            );
          }
        }
      });

      const monthlyChartData: MonthlyData[] = monthKeys.map((key) => {
        const totals = monthlyTotals.get(key) || { income: 0, expenses: 0 };
        return {
          month: formatMonthYear(key).split(" ")[0],
          incomeCents: totals.income,
          expenseCents: totals.expenses,
          balanceCents: totals.income - totals.expenses,
        };
      });

      setMonthlyData(monthlyChartData);

      const trendCategoryIds = Array.from(categorySpending.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([categoryId]) => categoryId);

      const trends: CategoryTrend[] = trendCategoryIds.map((categoryId, index) => {
        const category = categoryMap.get(categoryId);
        const color = category?.color || COLORS[index % COLORS.length];
        const data = monthKeys.map((key) => {
          const totals = monthlyCategoryTotals.get(key);
          return {
            month: formatMonthYear(key).split(" ")[0],
            valueCents: totals?.get(categoryId) || 0,
          };
        });
        return {
          categoryId,
          name: category?.name || "Uncategorized",
          color,
          data,
        };
      });

      setCategoryTrends(trends);

      const deltaIds = new Set([
        ...categorySpending.keys(),
        ...previousCategorySpending.keys(),
      ]);

      const deltaRows: CategoryDeltaRow[] = Array.from(deltaIds).map((categoryId) => {
        const currentCents = categorySpending.get(categoryId) || 0;
        const previousCents = previousCategorySpending.get(categoryId) || 0;
        const deltaCents = currentCents - previousCents;
        const percentChange =
          previousCents > 0 ? (deltaCents / previousCents) * 100 : null;
        const category = categoryMap.get(categoryId);

        return {
          categoryId,
          name: category?.name || "Uncategorized",
          currentCents,
          previousCents,
          deltaCents,
          percentChange,
        };
      });

      deltaRows.sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents));
      setMomDeltas(deltaRows.slice(0, 8));

      const weekdayTotals = Array.from({ length: 7 }, () => 0);
      monthTxs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const date = new Date(`${t.date}T00:00:00`);
          const weekday = date.getDay();
          weekdayTotals[weekday] += t.amountCents;
        });

      const weekdayRows: WeekdayData[] = WEEKDAY_LABELS.map((label, index) => ({
        label,
        amountCents: weekdayTotals[index],
      }));
      setWeekdayData(weekdayRows);

      const merchants = new Map<string, MerchantData>();
      monthTxs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const merchantName = (t.merchant || "").trim();
          if (!merchantName) {
            return;
          }
          const key = merchantName.toLowerCase();
          const current = merchants.get(key) || { name: merchantName, amountCents: 0 };
          current.amountCents += t.amountCents;
          merchants.set(key, current);
        });

      const merchantList = Array.from(merchants.values()).sort(
        (a, b) => b.amountCents - a.amountCents
      );
      const topMerchants = merchantList.slice(0, 10);
      const otherTotal = merchantList
        .slice(10)
        .reduce((sum, item) => sum + item.amountCents, 0);
      if (otherTotal > 0) {
        topMerchants.push({ name: "Other", amountCents: otherTotal });
      }
      setMerchantData(topMerchants);

      const utilizationData: BudgetUtilizationData[] = buds.map((budget) => {
        const spentCents = categorySpending.get(budget.categoryId) || 0;
        const category = categoryMap.get(budget.categoryId);
        const carryover = category?.rolloverEnabled
          ? carryoverByCategory.get(budget.categoryId) || 0
          : 0;
        const effectiveLimitCents = budget.limitCents + carryover;
        const percent =
          effectiveLimitCents > 0 ? (spentCents / effectiveLimitCents) * 100 : 0;
        return {
          categoryId: budget.categoryId,
          name: category?.name || "Unknown",
          spentCents,
          budgetCents: effectiveLimitCents,
          percent,
          color: category?.color || null,
        };
      });

      setBudgetUtilization(utilizationData);

      const largest = [...monthTxs]
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amountCents - a.amountCents)
        .slice(0, 5);

      setLargestTransactions(largest);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading) {
    return <LoadingScreen />;
  }

  const monthOptions: SelectOption[] = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({
      value: key,
      label: formatMonthYear(key),
    });
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const hasData = categoryData.length > 0;
  const netBalance = totalIncome - totalExpenses;
  const maxWeekday = Math.max(...weekdayData.map((item) => item.amountCents), 0);
  const merchantTotal = merchantData.reduce((sum, item) => sum + item.amountCents, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">Insights into your spending patterns</p>
          </div>

          <div className="w-full sm:w-64">
            <Select
              options={monthOptions}
              value={monthKey}
              onChange={(e) => setMonthKey(e.target.value)}
              label="Month"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--positive)]">{formatCents(totalIncome)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[var(--danger)]">{formatCents(totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  netBalance >= 0 ? "text-[var(--positive)]" : "text-[var(--danger)]"
                }`}
              >
                {formatCents(netBalance)}
              </p>
            </CardContent>
          </Card>
        </div>

        {!hasData ? (
          <EmptyState
            icon={<PieChartIcon size={48} />}
            title="No spending data"
            description="Add some transactions to see your analytics"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.percent?.toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="valueCents"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCents(Number(value))}
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipLabelStyle}
                        itemStyle={chartTooltipItemStyle}
                      />
                      <Legend wrapperStyle={chartLegendStyle} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-2">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCents(cat.valueCents)}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 w-12 text-right">
                            {cat.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetUtilization.length > 0 ? (
                    <div className="space-y-4">
                      {budgetUtilization.map((item) => {
                        const over = item.spentCents > item.budgetCents;
                        const variant = over ? "danger" : item.percent > 80 ? "warning" : "default";
                        return (
                          <div key={item.categoryId} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                {item.color && (
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                  />
                                )}
                                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                              </div>
                              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                                {formatCents(item.spentCents)} / {formatCents(item.budgetCents)}
                              </span>
                            </div>
                            <ProgressBar current={item.spentCents} max={item.budgetCents} variant={variant} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No category budgets set for this month.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses (6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={200}>
                    <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "currentColor" }}
                        className="text-gray-600 dark:text-gray-400 text-xs"
                      />
                      <YAxis
                        tick={{ fill: "currentColor" }}
                        className="text-gray-600 dark:text-gray-400 text-xs"
                        tickFormatter={(value) => formatCents(Number(value)).replace(".00", "")}
                      />
                      <Tooltip
                        formatter={(value) => formatCents(Number(value))}
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipLabelStyle}
                        itemStyle={chartTooltipItemStyle}
                      />
                      <Legend wrapperStyle={chartLegendStyle} />
                      <Bar dataKey="expenseCents" fill="var(--danger)" name="Expenses" stackId="stack" />
                      <Bar dataKey="incomeCents" fill="var(--positive)" name="Income" stackId="stack" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Trends (6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryTrends.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryTrends.map((trend) => (
                        <div key={trend.categoryId} className="p-3 rounded-lg bg-[var(--surface-strong)] border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {trend.name}
                            </span>
                            <span className="text-xs text-gray-500">Last 6 months</span>
                          </div>
                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={80}>
                              <LineChart data={trend.data}>
                                <Line
                                  type="monotone"
                                  dataKey="valueCents"
                                  stroke={trend.color}
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Tooltip
                                  formatter={(value) => formatCents(Number(value))}
                                  contentStyle={chartTooltipStyle}
                                  labelStyle={chartTooltipLabelStyle}
                                  itemStyle={chartTooltipItemStyle}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add spending across categories to see trends.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Month-over-Month Delta</CardTitle>
                </CardHeader>
                <CardContent>
                  {momDeltas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 dark:text-gray-400">
                            <th className="pb-2">Category</th>
                            <th className="pb-2">This Month</th>
                            <th className="pb-2">Last Month</th>
                            <th className="pb-2">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {momDeltas.map((row) => {
                            const isIncrease = row.deltaCents >= 0;
                            const deltaColor = isIncrease
                              ? "text-[var(--danger)]"
                              : "text-[var(--positive)]";
                            return (
                              <tr key={row.categoryId} className="border-t border-gray-100 dark:border-gray-800">
                                <td className="py-2 text-gray-700 dark:text-gray-300">{row.name}</td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">
                                  {formatCents(row.currentCents)}
                                </td>
                                <td className="py-2 text-gray-700 dark:text-gray-300">
                                  {formatCents(row.previousCents)}
                                </td>
                                <td className={`py-2 font-semibold ${deltaColor}`}>
                                  {isIncrease ? "+" : "-"}
                                  {formatCents(Math.abs(row.deltaCents))}
                                  <span className="ml-2 text-xs text-gray-500">
                                    {row.percentChange === null
                                      ? "new"
                                      : `${Math.abs(row.percentChange).toFixed(0)}%`}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Not enough data to compare months.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spend by Weekday</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {weekdayData.map((day) => {
                      const intensity =
                        maxWeekday > 0 ? 0.15 + 0.85 * (day.amountCents / maxWeekday) : 0.1;
                      return (
                        <div key={day.label} className="text-center">
                          <div
                            className="h-10 rounded-lg"
                            style={{ backgroundColor: `rgba(15, 107, 90, ${intensity})` }}
                            title={`${day.label}: ${formatCents(day.amountCents)}`}
                          />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{day.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Merchant Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {merchantData.length > 0 ? (
                    <div className="space-y-4">
                      {merchantData.map((merchant) => (
                        <div key={merchant.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{merchant.name}</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCents(merchant.amountCents)}
                            </span>
                          </div>
                          <ProgressBar
                            current={merchant.amountCents}
                            max={merchantTotal || merchant.amountCents}
                            showPercentage={false}
                          />
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

              {largestTransactions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Largest Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {largestTransactions.map((tx) => {
                        const category = categoryMap.get(tx.categoryId);

                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {tx.merchant || category?.name || "Uncategorized"}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{tx.date}</p>
                            </div>
                            <span className="font-semibold text-red-600 dark:text-red-400 ml-4">
                              {formatCents(tx.amountCents)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
