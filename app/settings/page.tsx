"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { LoadingScreen } from "@/components/ui/Loading";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Plus, X, Download, Upload, Trash2 } from "lucide-react";
import { getDataProvider, getDefaultDataProviderKind } from "@/services/dataProvider";
import { Category, Account, AccountType, RecurringTemplate, TransactionType } from "@/db/schema";
import { syncAll } from "@/services/supabaseSync";
import { isSupabaseConfigured } from "@/services/supabaseClient";
import { getCurrentSession, signOut } from "@/services/supabaseAuth";
import { formatCents, parseCentsInput } from "@/utils/formatting";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([]);
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#14b8a0");
  
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("bank");
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [templateType, setTemplateType] = useState<TransactionType>("expense");
  const [templateAmount, setTemplateAmount] = useState("");
  const [templateCategoryId, setTemplateCategoryId] = useState("");
  const [templateAccountId, setTemplateAccountId] = useState("");
  const [templateMerchant, setTemplateMerchant] = useState("");
  const [templateNote, setTemplateNote] = useState("");
  const [templateDayOfMonth, setTemplateDayOfMonth] = useState("1");
  const [templateError, setTemplateError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!templateCategoryId && categories.length > 0) {
      setTemplateCategoryId(categories[0].id);
    }
  }, [categories, templateCategoryId]);

  async function loadSettings() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      if (isSupabaseConfigured() && getDefaultDataProviderKind() === "supabase") {
        const session = await getCurrentSession();
        setUserEmail(session?.user?.email ?? null);
      } else {
        setUserEmail(null);
      }
      
      const [cats, accs, templates] = await Promise.all([
        provider.categories.list(),
        provider.accounts.list(),
        provider.recurringTemplates.list(),
      ]);
      
      setCategories(cats);
      setAccounts(accs);
      setRecurringTemplates(templates);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      await provider.categories.add({
        name: newCategoryName.trim(),
        parentId: null,
        order: categories.length,
        color: newCategoryColor,
        rolloverEnabled: false,
      });
      
      setNewCategoryName("");
      setNewCategoryColor("#14b8a0");
      setShowAddCategory(false);
      
      await loadSettings();
    } catch (error) {
      console.error("Failed to add category:", error);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure? This will affect existing transactions.")) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      await provider.categories.delete(id);
      await loadSettings();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }

  async function handleAddAccount(e: FormEvent) {
    e.preventDefault();
    
    if (!newAccountName.trim()) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      await provider.accounts.add({
        name: newAccountName.trim(),
        type: newAccountType,
      });
      
      setNewAccountName("");
      setNewAccountType("bank");
      setShowAddAccount(false);
      
      await loadSettings();
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm("Are you sure? This will affect existing transactions.")) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      await provider.accounts.delete(id);
      await loadSettings();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  }

  async function handleAddTemplate(e: FormEvent) {
    e.preventDefault();
    setTemplateError("");

    const amountCents = parseCentsInput(templateAmount);
    const dayOfMonth = Number(templateDayOfMonth);
    if (!amountCents || amountCents <= 0) {
      setTemplateError("Enter a valid amount.");
      return;
    }
    if (!templateCategoryId) {
      setTemplateError("Select a category.");
      return;
    }
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      setTemplateError("Day of month must be between 1 and 31.");
      return;
    }

    try {
      const provider = getDataProvider();
      await provider.recurringTemplates.add({
        type: templateType,
        amountCents,
        categoryId: templateCategoryId,
        accountId: templateAccountId || null,
        merchant: templateMerchant.trim() || null,
        note: templateNote.trim() || null,
        cadence: "monthly",
        dayOfMonth,
        isActive: true,
        lastPostedMonth: null,
      });

      setTemplateAmount("");
      setTemplateMerchant("");
      setTemplateNote("");
      setTemplateDayOfMonth("1");
      setShowAddTemplate(false);
      await loadSettings();
    } catch (error) {
      console.error("Failed to add recurring template:", error);
      setTemplateError("Failed to add template.");
    }
  }

  async function handleToggleTemplate(id: string, enabled: boolean) {
    try {
      const provider = getDataProvider();
      await provider.recurringTemplates.update(id, { isActive: enabled });
      await loadSettings();
    } catch (error) {
      console.error("Failed to update template:", error);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("Delete this recurring template?")) {
      return;
    }

    try {
      const provider = getDataProvider();
      await provider.recurringTemplates.delete(id);
      await loadSettings();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  }

  async function handleExportJson() {
    try {
      const provider = getDataProvider();
      const data = await provider.exportJson();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-tracker-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data");
    }
  }

  async function handleExportCsv() {
    try {
      const provider = getDataProvider();
      const csv = await provider.exportCsv();
      
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-tracker-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV");
    }
  }

  async function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const provider = getDataProvider();
      const report = await provider.importJson(data);
      
      alert(
        `Import completed!\nTransactions: ${report.transactionsAdded}\nCategories: ${report.categoriesAdded}\nRecurring Templates: ${report.recurringTemplatesAdded}\nBudgets: ${report.budgetsAdded}\nMonthly Budgets: ${report.monthlyBudgetsAdded}\nAccounts: ${report.accountsAdded}`
      );
      
      await loadSettings();
    } catch (error) {
      console.error("Failed to import data:", error);
      alert("Failed to import data. Please check the file format.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleResetData() {
    if (!confirm("WARNING: This will delete ALL your data. This cannot be undone. Are you absolutely sure?")) {
      return;
    }
    
    if (!confirm("Last chance! All transactions, categories, budgets, and accounts will be permanently deleted.")) {
      return;
    }
    
    try {
      const provider = getDataProvider();
      
      // Delete all data
      const [txs, cats, buds, monthlyBuds, accs] = await Promise.all([
        provider.transactions.list(),
        provider.categories.list(),
        provider.budgets.list(),
        provider.monthlyBudgets.list(),
        provider.accounts.list(),
      ]);
      
      await Promise.all([
        ...txs.map((tx) => provider.transactions.delete(tx.id)),
        ...cats.map((cat) => provider.categories.delete(cat.id)),
        ...buds.map((bud) => provider.budgets.delete(bud.id)),
        ...monthlyBuds.map((bud) => provider.monthlyBudgets.delete(bud.id)),
        ...accs.map((acc) => provider.accounts.delete(acc.id)),
      ]);
      
      alert("All data has been deleted.");
      await loadSettings();
    } catch (error) {
      console.error("Failed to reset data:", error);
      alert("Failed to reset data");
    }
  }

  async function handleManualSync() {
    setSyncing(true);
    try {
      await syncAll();
    } catch (error) {
      console.error("Failed to sync:", error);
      alert("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setUserEmail(null);
      router.replace("/auth");
    } catch (error) {
      console.error("Failed to sign out:", error);
      alert("Sign out failed. Please try again.");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const canSync = isSupabaseConfigured() && getDefaultDataProviderKind() === "supabase";
  const templateCategoryOptions: SelectOption[] = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const templateAccountOptions: SelectOption[] = [
    { value: "", label: "No account" },
    ...accounts.map((account) => ({
      value: account.id,
      label: account.name,
    })),
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage categories, accounts, and data</p>
        </div>
        
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        
        {canSync && (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Signed in as {userEmail ?? "Unknown user"}
              </p>
              <p className="text-xs text-gray-500">Sync runs automatically when you are online.</p>
              <div className="mt-3">
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categories</CardTitle>
              {!showAddCategory && (
                <Button size="sm" onClick={() => setShowAddCategory(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Category
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAddCategory && (
              <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl space-y-3">
                <Input
                  label="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Groceries"
                  autoFocus
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-10 w-20 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddCategory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.color || "#cccccc" }}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              
              {categories.length === 0 && !showAddCategory && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No categories yet</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Accounts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Accounts</CardTitle>
              {!showAddAccount && (
                <Button size="sm" onClick={() => setShowAddAccount(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Account
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAddAccount && (
              <form onSubmit={handleAddAccount} className="mb-4 p-4 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl space-y-3">
                <Input
                  label="Account Name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g., Main Checking"
                  autoFocus
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-colors"
                  >
                    {ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddAccount(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{acc.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{acc.type}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAccount(acc.id)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              
              {accounts.length === 0 && !showAddAccount && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No accounts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Recurring Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recurring Templates</CardTitle>
              {!showAddTemplate && (
                <Button size="sm" onClick={() => setShowAddTemplate(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Template
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showAddTemplate && (
              <form
                onSubmit={handleAddTemplate}
                className="mb-4 p-4 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={templateType === "expense" ? "primary" : "secondary"}
                    onClick={() => setTemplateType("expense")}
                  >
                    Expense
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={templateType === "income" ? "primary" : "secondary"}
                    onClick={() => setTemplateType("income")}
                  >
                    Income
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Amount"
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={templateAmount}
                    onChange={(e) => setTemplateAmount(e.target.value)}
                    placeholder="0.00"
                  />
                  <Select
                    label="Category"
                    options={templateCategoryOptions}
                    value={templateCategoryId}
                    onChange={(e) => setTemplateCategoryId(e.target.value)}
                    placeholder="Select category"
                  />
                  <Select
                    label="Account"
                    options={templateAccountOptions}
                    value={templateAccountId}
                    onChange={(e) => setTemplateAccountId(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Merchant"
                    value={templateMerchant}
                    onChange={(e) => setTemplateMerchant(e.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Note"
                    value={templateNote}
                    onChange={(e) => setTemplateNote(e.target.value)}
                    placeholder="Optional"
                  />
                  <Input
                    label="Day of Month"
                    type="number"
                    min="1"
                    max="31"
                    value={templateDayOfMonth}
                    onChange={(e) => setTemplateDayOfMonth(e.target.value)}
                  />
                </div>
                {templateError && (
                  <p className="text-sm text-[var(--danger)]">{templateError}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm">Add</Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddTemplate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {recurringTemplates.map((template) => {
                const category = categories.find((cat) => cat.id === template.categoryId);
                return (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-[var(--surface-strong)] border border-[var(--border)] rounded-xl"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {template.merchant || category?.name || "Recurring"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Day {template.dayOfMonth} • {template.type} • {formatCents(template.amountCents)}
                      </p>
                      {template.lastPostedMonth && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last posted {template.lastPostedMonth}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={template.isActive}
                          onChange={(e) => handleToggleTemplate(template.id, e.target.checked)}
                          className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                        />
                        Active
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {recurringTemplates.length === 0 && !showAddTemplate && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No recurring templates yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {canSync && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Cloud sync runs automatically in the background
                  </p>
                  <Button variant="secondary" onClick={handleManualSync} disabled={syncing}>
                    {syncing ? "Syncing..." : "Sync Now"}
                  </Button>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Export your data for backup or analysis</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleExportJson}>
                    <Download size={16} />
                    Export JSON
                  </Button>
                  <Button variant="secondary" onClick={handleExportCsv}>
                    <Download size={16} />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="border-t border-[var(--border)] pt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Import data from a backup file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} />
                  Import JSON
                </Button>
              </div>
              
              <div className="border-t border-[var(--border)] pt-3">
                <p className="text-sm text-red-600 dark:text-red-400 mb-2 font-medium">
                  Danger Zone: This action cannot be undone
                </p>
                <Button variant="danger" onClick={handleResetData}>
                  <Trash2 size={16} />
                  Delete All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
