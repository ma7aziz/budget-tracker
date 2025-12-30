"use client";

import { Transaction } from "@/db/schema";
import { formatCents, formatDate } from "@/utils/formatting";
import { Card } from "../ui/Card";

export interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Map<string, string>;
  onTransactionClick?: (transaction: Transaction) => void;
}

export function RecentTransactions({
  transactions,
  categories,
  onTransactionClick,
}: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8">No recent transactions</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const categoryName = categories.get(transaction.categoryId) || "Uncategorized";
          const isExpense = transaction.type === "expense";
          
          return (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {transaction.merchant || categoryName}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatDate(transaction.date)}</span>
                  {transaction.merchant && (
                    <>
                      <span>•</span>
                      <span className="truncate">{categoryName}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`font-semibold ${isExpense ? "text-red-600" : "text-green-600"}`}>
                {isExpense ? "-" : "+"}{formatCents(transaction.amountCents)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
