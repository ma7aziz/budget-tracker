"use client";

import { formatCents } from "@/utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { CalendarClock, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export interface MonthlySummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalBudget: number;
  averageDailySpendCents: number;
  averageDailySpendLabel: string;
  averageDailySpendMode: "elapsed" | "month";
  showAverageDailyToggle?: boolean;
  onAverageDailySpendModeChange?: (mode: "elapsed" | "month") => void;
}

export function MonthlySummary({
  totalIncome,
  totalExpenses,
  totalBudget,
  averageDailySpendCents,
  averageDailySpendLabel,
  averageDailySpendMode,
  showAverageDailyToggle = false,
  onAverageDailySpendModeChange,
}: MonthlySummaryProps) {
  const balance = totalIncome - totalExpenses;
  const remaining = totalBudget - totalExpenses;
  const budgetUsedPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</CardTitle>
            <TrendingUp className="text-[var(--positive)]" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-[var(--positive)]">{formatCents(totalIncome)}</p>
        </CardContent>
      </Card>
      
      <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            <TrendingDown className="text-[var(--danger)]" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-[var(--danger)]">{formatCents(totalExpenses)}</p>
        </CardContent>
      </Card>
      
      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Budget</CardTitle>
            <Wallet
              className={remaining >= 0 ? "text-[var(--positive)]" : "text-[var(--danger)]"}
              size={20}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              remaining >= 0 ? "text-[var(--positive)]" : "text-[var(--danger)]"
            }`}
          >
            {formatCents(remaining)}
          </p>
          {totalBudget > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {budgetUsedPercentage.toFixed(0)}% of budget used
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg Daily Spend
            </CardTitle>
            <div className="flex items-center gap-2">
              <CalendarClock className="text-[var(--muted)]" size={20} />
              {showAverageDailyToggle && (
                <div className="flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onAverageDailySpendModeChange?.("elapsed")}
                    aria-pressed={averageDailySpendMode === "elapsed"}
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      averageDailySpendMode === "elapsed"
                        ? "bg-[var(--surface-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    To date
                  </button>
                  <button
                    type="button"
                    onClick={() => onAverageDailySpendModeChange?.("month")}
                    aria-pressed={averageDailySpendMode === "month"}
                    className={`px-2 py-0.5 rounded-full transition-colors ${
                      averageDailySpendMode === "month"
                        ? "bg-[var(--surface-strong)] text-[var(--ink)] shadow-[var(--shadow-soft)]"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                  >
                    Full
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-[var(--ink)]">{formatCents(averageDailySpendCents)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{averageDailySpendLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}
