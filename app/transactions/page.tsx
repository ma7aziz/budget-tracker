"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { LoadingScreen } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Search, Receipt } from "lucide-react";
import { getDataProvider } from "@/services/dataProvider";
import { Transaction, Category, Account } from "@/db/schema";
import { formatCents, formatDate } from "@/utils/formatting";

type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAccount, setFilterAccount] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [txs, cats, accs] = await Promise.all([
        provider.transactions.list(),
        provider.categories.list(),
        provider.accounts.list(),
      ]);
      
      setAllTransactions(txs);
      setCategories(cats);
      setAccounts(accs);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  function getFilteredTransactions(): Transaction[] {
    let filtered = [...allTransactions];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tx) => {
        const merchant = (tx.merchant || "").toLowerCase();
        const note = (tx.note || "").toLowerCase();
        return merchant.includes(query) || note.includes(query);
      });
    }
    
    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((tx) => tx.categoryId === filterCategory);
    }
    
    // Account filter
    if (filterAccount) {
      filtered = filtered.filter((tx) => tx.accountId === filterAccount);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amountCents - a.amountCents;
        case "amount-asc":
          return a.amountCents - b.amountCents;
        default:
          return 0;
      }
    });
    
    return filtered;
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterCategory("");
    setFilterAccount("");
    setSortBy("date-desc");
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  
  const filteredTransactions = getFilteredTransactions();
  
  const categoryOptions: SelectOption[] = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ];
  
  const accountOptions: SelectOption[] = [
    { value: "", label: "All Accounts" },
    ...accounts.map((acc) => ({ value: acc.id, label: acc.name })),
  ];
  
  const sortOptions: SelectOption[] = [
    { value: "date-desc", label: "Date (Newest)" },
    { value: "date-asc", label: "Date (Oldest)" },
    { value: "amount-desc", label: "Amount (High to Low)" },
    { value: "amount-asc", label: "Amount (Low to High)" },
  ];
  
  const hasActiveFilters = searchQuery || filterCategory || filterAccount || sortBy !== "date-desc";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h2>
        </div>
        
        <Card>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search merchant or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                options={categoryOptions}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              />
              
              <Select
                options={accountOptions}
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                label="Account"
              />
              
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                label="Sort By"
              />
            </div>
            
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title={hasActiveFilters ? "No transactions found" : "No transactions yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters"
                : "Start tracking your expenses by adding your first transaction"
            }
            action={
              !hasActiveFilters && (
                <Button onClick={() => router.push("/transactions/new")}>
                  <Plus size={16} className="mr-2" />
                  Add Transaction
                </Button>
              )
            }
          />
        ) : (
          <Card>
            <div className="divide-y divide-[var(--border)]">
              {filteredTransactions.map((tx) => {
                const category = categoryMap.get(tx.categoryId);
                const account = accountMap.get(tx.accountId || "");
                const isExpense = tx.type === "expense";
                
                return (
                  <div
                    key={tx.id}
                    onClick={() => router.push(`/transactions/${tx.id}`)}
                    className="p-4 hover:bg-[var(--surface-strong)] cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {category?.color && (
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {tx.merchant || category?.name || "Uncategorized"}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatDate(tx.date)}</span>
                          
                          {tx.merchant && (
                            <>
                              <span>•</span>
                              <span className="truncate">{category?.name}</span>
                            </>
                          )}
                          
                          {account && (
                            <>
                              <span>•</span>
                              <span className="truncate">{account.name}</span>
                            </>
                          )}
                          
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span className="truncate italic">{tx.note}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div
                        className={`font-semibold whitespace-nowrap ${
                          isExpense ? "text-[var(--danger)]" : "text-[var(--positive)]"
                        }`}
                      >
                        {isExpense ? "-" : "+"}{formatCents(tx.amountCents)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        
        <div className="text-center text-sm text-gray-500">
          Showing {filteredTransactions.length} of {allTransactions.length} transactions
        </div>
      </div>
      
      <FloatingActionButton
        icon={<Plus size={24} />}
        onClick={() => router.push("/transactions/new")}
        aria-label="Add transaction"
      />
    </AppLayout>
  );
}
