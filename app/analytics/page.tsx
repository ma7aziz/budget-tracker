"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select, SelectOption } from "@/components/ui/Select";
import { LoadingScreen } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getDataProvider } from "@/services/dataProvider";
import { Transaction, Category } from "@/db/schema";
import { formatCents, getCurrentMonthKey, formatMonthYear } from "@/utils/formatting";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
  [key: string]: string | number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  [key: string]: string | number;
}

const COLORS = ["#0f6b5a", "#14b8a0", "#2dd4b8", "#5fe9ce", "#99f6e0", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [largestTransactions, setLargestTransactions] = useState<Transaction[]>([]);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadAnalyticsData();
  }, [monthKey]);

  async function loadAnalyticsData() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [txs, cats] = await Promise.all([
        provider.transactions.list(),
        provider.categories.list(),
      ]);
      
      setTransactions(txs);
      setCategories(cats);
      
      // Filter transactions for selected month
      const monthTxs = txs.filter((t) => t.date.startsWith(monthKey));
      
      // Calculate category breakdown
      const categoryMap = new Map(cats.map((c) => [c.id, c]));
      const categorySpending = new Map<string, number>();
      
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
      
      setTotalIncome(income);
      setTotalExpenses(expenses);
      
      // Prepare category chart data
      const catData: CategoryData[] = Array.from(categorySpending.entries())
        .map(([categoryId, amount], index) => {
          const category = categoryMap.get(categoryId);
          const percentage = expenses > 0 ? (amount / expenses) * 100 : 0;
          
          return {
            name: category?.name || "Uncategorized",
            value: amount / 100,
            color: category?.color || COLORS[index % COLORS.length],
            percentage,
          };
        })
        .sort((a, b) => b.value - a.value);
      
      setCategoryData(catData);
      
      // Calculate monthly comparison (last 6 months)
      const monthlyMap = new Map<string, { income: number; expenses: number }>();
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(key, { income: 0, expenses: 0 });
      }
      
      txs.forEach((t) => {
        const tMonthKey = t.date.substring(0, 7);
        if (monthlyMap.has(tMonthKey)) {
          const current = monthlyMap.get(tMonthKey)!;
          if (t.type === "income") {
            current.income += t.amountCents;
          } else {
            current.expenses += t.amountCents;
          }
        }
      });
      
      const monthlyChartData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month: formatMonthYear(month).split(" ")[0],
        income: data.income / 100,
        expenses: data.expenses / 100,
        balance: (data.income - data.expenses) / 100,
      }));
      
      setMonthlyData(monthlyChartData);
      
      // Get largest transactions
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
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Generate month options (current month + 11 previous months)
  const monthOptions: SelectOption[] = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({
      value: key,
      label: formatMonthYear(key),
    });
  }
  
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const hasData = categoryData.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <p className="text-gray-600">Insights into your spending patterns</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCents(totalIncome)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCents(totalExpenses)}</p>
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
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${((entry.percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-6 space-y-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-gray-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-gray-900">
                          ${cat.value.toFixed(2)}
                        </span>
                        <span className="text-gray-500 w-12 text-right">
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
                <CardTitle>Month-over-Month Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
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
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {tx.merchant || category?.name || "Uncategorized"}
                            </p>
                            <p className="text-sm text-gray-500">{tx.date}</p>
                          </div>
                          <span className="font-semibold text-red-600 ml-4">
                            {formatCents(tx.amountCents)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
