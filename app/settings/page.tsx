"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingScreen } from "@/components/ui/Loading";
import { Plus, X, Download, Upload, Trash2 } from "lucide-react";
import { getDataProvider } from "@/services/dataProvider";
import { Category, Account, AccountType } from "@/db/schema";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#14b8a0");
  
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("bank");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [cats, accs] = await Promise.all([
        provider.categories.list(),
        provider.accounts.list(),
      ]);
      
      setCategories(cats);
      setAccounts(accs);
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
      
      alert(`Import completed!\nTransactions: ${report.transactionsAdded}\nCategories: ${report.categoriesAdded}\nBudgets: ${report.budgetsAdded}\nAccounts: ${report.accountsAdded}`);
      
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
      const [txs, cats, buds, accs] = await Promise.all([
        provider.transactions.list(),
        provider.categories.list(),
        provider.budgets.list(),
        provider.accounts.list(),
      ]);
      
      await Promise.all([
        ...txs.map((tx) => provider.transactions.delete(tx.id)),
        ...cats.map((cat) => provider.categories.delete(cat.id)),
        ...buds.map((bud) => provider.budgets.delete(bud.id)),
        ...accs.map((acc) => provider.accounts.delete(acc.id)),
      ]);
      
      alert("All data has been deleted.");
      await loadSettings();
    } catch (error) {
      console.error("Failed to reset data:", error);
      alert("Failed to reset data");
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage categories, accounts, and data</p>
        </div>
        
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
              <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  label="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Groceries"
                  autoFocus
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer"
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
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cat.color || "#cccccc" }}
                    />
                    <span className="font-medium text-gray-900">{cat.name}</span>
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
                <p className="text-center text-gray-500 py-4">No categories yet</p>
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
              <form onSubmit={handleAddAccount} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  label="Account Name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="e.g., Main Checking"
                  autoFocus
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Type
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{acc.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{acc.type}</p>
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
                <p className="text-center text-gray-500 py-4">No accounts yet</p>
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
              <div>
                <p className="text-sm text-gray-600 mb-2">Export your data for backup or analysis</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleExportJson}>
                    <Download size={16} className="mr-2" />
                    Export JSON
                  </Button>
                  <Button variant="secondary" onClick={handleExportCsv}>
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Import data from a backup file</p>
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
                  <Upload size={16} className="mr-2" />
                  Import JSON
                </Button>
              </div>
              
              <div className="border-t pt-3">
                <p className="text-sm text-red-600 mb-2 font-medium">
                  Danger Zone: This action cannot be undone
                </p>
                <Button variant="danger" onClick={handleResetData}>
                  <Trash2 size={16} className="mr-2" />
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
