"use client";

import { formatCents } from "@/utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

export interface MonthlySummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalBudget: number;
}

export function MonthlySummary({ totalIncome, totalExpenses, totalBudget }: MonthlySummaryProps) {
  const balance = totalIncome - totalExpenses;
  const remaining = totalBudget - totalExpenses;
  const budgetUsedPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="animate-slide-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</CardTitle>
            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCents(totalIncome)}</p>
        </CardContent>
      </Card>
      
      <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCents(totalExpenses)}</p>
        </CardContent>
      </Card>
      
      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining Budget</CardTitle>
            <Wallet className={remaining >= 0 ? "text-primary-600 dark:text-primary-400" : "text-red-600 dark:text-red-400"} size={20} />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${remaining >= 0 ? "text-primary-600 dark:text-primary-400" : "text-red-600 dark:text-red-400"}`}>
            {formatCents(remaining)}
          </p>
          {totalBudget > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {budgetUsedPercentage.toFixed(0)}% of budget used
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
