"use client";

import { formatCents } from "@/utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amountCents: number;
  budgetCents: number;
  percentage: number;
  color?: string;
}

export interface TopCategoriesProps {
  categories: CategorySpending[];
}

export function TopCategories({ categories }: TopCategoriesProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No spending data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const overBudget = category.budgetCents > 0 && category.amountCents > category.budgetCents;
            const variant = overBudget ? "danger" : category.percentage > 80 ? "warning" : "default";
            
            return (
              <div key={category.categoryId}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="font-medium text-gray-900 dark:text-gray-100">{category.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCents(category.amountCents)}
                    </span>
                    {category.budgetCents > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        / {formatCents(category.budgetCents)}
                      </span>
                    )}
                  </div>
                </div>
                {category.budgetCents > 0 && (
                  <ProgressBar
                    current={category.amountCents}
                    max={category.budgetCents}
                    variant={variant}
                    showPercentage={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
