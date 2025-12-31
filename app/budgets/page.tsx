"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadingScreen } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { DollarSign, Plus, X } from "lucide-react";
import { getDataProvider } from "@/services/dataProvider";
import { Budget, Category, MonthlyBudget } from "@/db/schema";
import { formatCents, getCurrentMonthKey, formatMonthYear, parseCentsInput } from "@/utils/formatting";

interface BudgetWithSpending extends Budget {
  categoryName: string;
  categoryColor: string | null;
  spentCents: number;
  remainingCents: number;
  percentage: number;
}

export default function BudgetsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthKey] = useState(getCurrentMonthKey());
  
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget | null>(null);
  const [totalSpentAll, setTotalSpentAll] = useState(0);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [formError, setFormError] = useState("");
  const [monthlyLimitAmount, setMonthlyLimitAmount] = useState("");
  const [monthlyFormError, setMonthlyFormError] = useState("");

  const loadBudgetData = useCallback(async () => {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [cats, buds, txs, monthBudget] = await Promise.all([
        provider.categories.list(),
        provider.budgets.listForMonth(monthKey),
        provider.transactions.listByMonth(monthKey),
        provider.monthlyBudgets.getForMonth(monthKey),
      ]);
      
      setCategories(cats);
      setMonthlyBudget(monthBudget ?? null);
      setMonthlyLimitAmount(
        monthBudget ? (monthBudget.limitCents / 100).toFixed(2) : ""
      );
      
      // Calculate spending per category
      const categorySpending = new Map<string, number>();
      let totalSpent = 0;
      txs
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const current = categorySpending.get(t.categoryId) || 0;
          categorySpending.set(t.categoryId, current + t.amountCents);
          totalSpent += t.amountCents;
        });
      
      // Combine budgets with spending
      const budgetsWithSpending: BudgetWithSpending[] = buds.map((budget) => {
        const category = cats.find((c) => c.id === budget.categoryId);
        const spentCents = categorySpending.get(budget.categoryId) || 0;
        const remainingCents = budget.limitCents - spentCents;
        const percentage = budget.limitCents > 0 ? (spentCents / budget.limitCents) * 100 : 0;
        
        return {
          ...budget,
          categoryName: category?.name || "Unknown",
          categoryColor: category?.color || null,
          spentCents,
          remainingCents,
          percentage,
        };
      });
      
      setBudgets(budgetsWithSpending);
      setTotalSpentAll(totalSpent);
    } catch (error) {
      console.error("Failed to load budget data:", error);
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  async function handleSaveMonthlyBudget(e: FormEvent) {
    e.preventDefault();
    setMonthlyFormError("");

    const limitCents = parseCentsInput(monthlyLimitAmount);
    if (limitCents === null || limitCents <= 0) {
      setMonthlyFormError("Please enter a valid amount");
      return;
    }

    try {
      setSaving(true);
      const provider = getDataProvider();
      await provider.monthlyBudgets.upsertForMonth(monthKey, limitCents);
      await loadBudgetData();
    } catch (error) {
      console.error("Failed to save monthly budget:", error);
      setMonthlyFormError("Failed to save monthly budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMonthlyBudget() {
    if (!monthlyBudget) {
      return;
    }

    if (!confirm("Remove the monthly budget for this month?")) {
      return;
    }

    try {
      const provider = getDataProvider();
      await provider.monthlyBudgets.delete(monthlyBudget.id);
      setMonthlyLimitAmount("");
      await loadBudgetData();
    } catch (error) {
      console.error("Failed to delete monthly budget:", error);
    }
  }

  async function handleAddBudget(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    
    if (!selectedCategoryId) {
      setFormError("Please select a category");
      return;
    }
    
    const limitCents = parseCentsInput(limitAmount);
    if (limitCents === null || limitCents <= 0) {
      setFormError("Please enter a valid amount");
      return;
    }
    
    try {
      setSaving(true);
      const provider = getDataProvider();
      await provider.budgets.upsertForMonth(monthKey, selectedCategoryId, limitCents);
      
      setShowAddForm(false);
      setSelectedCategoryId("");
      setLimitAmount("");
      
      await loadBudgetData();
    } catch (error) {
      console.error("Failed to save budget:", error);
      setFormError("Failed to save budget");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBudget(budgetId: string) {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      await provider.budgets.delete(budgetId);
      await loadBudgetData();
    } catch (error) {
      console.error("Failed to delete budget:", error);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.categoryId === cat.id)
  );
  
  const categoryOptions: SelectOption[] = availableCategories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
  
  const totalBudget =
    monthlyBudget?.limitCents ?? budgets.reduce((sum, b) => sum + b.limitCents, 0);
  const totalSpent = monthlyBudget
    ? totalSpentAll
    : budgets.reduce((sum, b) => sum + b.spentCents, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Budgets</h2>
            <p className="text-gray-600 dark:text-gray-400">{formatMonthYear(monthKey)}</p>
          </div>
          
          {!showAddForm && availableCategories.length > 0 && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus size={16} className="mr-2" />
              Add Category Budget
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveMonthlyBudget} className="space-y-3">
              <Input
                label="Total Budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={monthlyLimitAmount}
                onChange={(e) => setMonthlyLimitAmount(e.target.value)}
                inputMode="decimal"
                error={monthlyFormError}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {monthlyBudget ? "Update Monthly Budget" : "Set Monthly Budget"}
                </Button>
                {monthlyBudget && (
                  <Button type="button" variant="secondary" onClick={handleDeleteMonthlyBudget}>
                    Remove
                  </Button>
                )}
              </div>
            </form>

            {monthlyBudget && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Spent so far</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCents(totalSpentAll)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Remaining</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCents(monthlyBudget.limitCents - totalSpentAll)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {showAddForm && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Category Budget</CardTitle>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddBudget} className="space-y-4">
                <Select
                  label="Category"
                  options={categoryOptions}
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  placeholder="Select a category"
                />
                
                <Input
                  label="Budget Limit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  inputMode="decimal"
                />
                
                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormError("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Category Budget"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        {totalBudget > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Total Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Budget:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCents(totalBudget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{formatCents(totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                  <span className={`font-semibold ${totalRemaining >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCents(totalRemaining)}
                  </span>
                </div>
                <ProgressBar
                  current={totalSpent}
                  max={totalBudget}
                  variant={totalSpent > totalBudget ? "danger" : totalSpent > totalBudget * 0.8 ? "warning" : "default"}
                  className="mt-4"
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {budgets.length === 0 ? (
          <EmptyState
            icon={<DollarSign size={48} />}
            title="No category budgets"
            description="Add category budgets to break down your monthly spending"
            action={
              availableCategories.length > 0 && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus size={16} className="mr-2" />
                  Add First Category Budget
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget) => {
              const overBudget = budget.spentCents > budget.limitCents;
              const nearLimit = budget.percentage > 80 && !overBudget;
              const variant = overBudget ? "danger" : nearLimit ? "warning" : "default";
              
              return (
                <Card key={budget.id}>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {budget.categoryColor && (
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: budget.categoryColor }}
                            />
                          )}
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{budget.categoryName}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBudget(budget.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Spent:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCents(budget.spentCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCents(budget.limitCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                          <span className={`font-semibold ${budget.remainingCents >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                            {formatCents(Math.abs(budget.remainingCents))}
                            {budget.remainingCents < 0 && " over"}
                          </span>
                        </div>
                      </div>
                      
                      <ProgressBar
                        current={budget.spentCents}
                        max={budget.limitCents}
                        variant={variant}
                      />
                      
                      {overBudget && (
                        <p className="text-sm text-red-600 font-medium">
                          Over budget by {budget.percentage.toFixed(0)}%
                        </p>
                      )}
                      {nearLimit && !overBudget && (
                        <p className="text-sm text-yellow-600 font-medium">
                          {(100 - budget.percentage).toFixed(0)}% remaining
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
