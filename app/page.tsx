"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MonthlySummary } from "@/components/dashboard/MonthlySummary";
import { TopCategories, CategorySpending } from "@/components/dashboard/TopCategories";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { LoadingScreen } from "@/components/ui/Loading";
import { Plus } from "lucide-react";
import { getDataProvider } from "@/services/dataProvider";
import { Transaction, Category, Budget } from "@/db/schema";
import { getCurrentMonthKey, formatMonthYear } from "@/utils/formatting";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [monthKey] = useState(getCurrentMonthKey());
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [monthKey]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [txs, cats, buds] = await Promise.all([
        provider.transactions.listByMonth(monthKey),
        provider.categories.list(),
        provider.budgets.listForMonth(monthKey),
      ]);
      
      setTransactions(txs);
      setCategories(cats);
      setBudgets(buds);
      
      // Calculate totals
      const income = txs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amountCents, 0);
      
      const expenses = txs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amountCents, 0);
      
      const budget = buds.reduce((sum, b) => sum + b.limitCents, 0);
      
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setTotalBudget(budget);
      
      // Calculate category spending
      const categoryMap = new Map(cats.map((c) => [c.id, c]));
      const budgetMap = new Map(buds.map((b) => [b.categoryId, b.limitCents]));
      
      const categorySpending = new Map<string, number>();
      txs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const current = categorySpending.get(t.categoryId) || 0;
          categorySpending.set(t.categoryId, current + t.amountCents);
        });
      
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
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleQuickAdd() {
    router.push("/transactions/new");
  }

  function handleTransactionClick(transaction: Transaction) {
    router.push(`/transactions/${transaction.id}`);
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{formatMonthYear(monthKey)}</h2>
          <p className="text-gray-600">Overview of your spending this month</p>
        </div>
        
        <MonthlySummary
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          totalBudget={totalBudget}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopCategories categories={topCategories} />
          <RecentTransactions
            transactions={recentTransactions}
            categories={categoryNameMap}
            onTransactionClick={handleTransactionClick}
          />
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
