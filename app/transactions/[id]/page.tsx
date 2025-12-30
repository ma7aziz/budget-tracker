"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/Loading";
import { Trash2 } from "lucide-react";
import { getDataProvider } from "@/services/dataProvider";
import { Transaction, Category, Account, TransactionType } from "@/db/schema";
import { parseCentsInput } from "@/utils/formatting";

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTransactionData();
  }, [transactionId]);

  async function loadTransactionData() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [tx, cats, accs] = await Promise.all([
        provider.transactions.get(transactionId),
        provider.categories.list(),
        provider.accounts.list(),
      ]);
      
      if (!tx) {
        router.push("/transactions");
        return;
      }
      
      setTransaction(tx);
      setCategories(cats);
      setAccounts(accs);
      
      setType(tx.type);
      setAmount((tx.amountCents / 100).toFixed(2));
      setDate(tx.date);
      setCategoryId(tx.categoryId);
      setAccountId(tx.accountId || "");
      setMerchant(tx.merchant || "");
      setNote(tx.note || "");
    } catch (error) {
      console.error("Failed to load transaction:", error);
      router.push("/transactions");
    } finally {
      setLoading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!amount || parseCentsInput(amount) === null) {
      newErrors.amount = "Please enter a valid amount";
    }
    
    if (!date) {
      newErrors.date = "Please select a date";
    }
    
    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setSaving(true);
      const provider = getDataProvider();
      
      const amountCents = parseCentsInput(amount)!;
      
      await provider.transactions.update(transactionId, {
        type,
        amountCents,
        date,
        categoryId,
        accountId: accountId || null,
        merchant: merchant || null,
        note: note || null,
      });
      
      router.push("/transactions");
    } catch (error) {
      console.error("Failed to update transaction:", error);
      setErrors({ submit: "Failed to update transaction" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }
    
    try {
      setDeleting(true);
      const provider = getDataProvider();
      await provider.transactions.delete(transactionId);
      router.push("/transactions");
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      setErrors({ submit: "Failed to delete transaction" });
      setDeleting(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!transaction) {
    return null;
  }

  const typeOptions: SelectOption[] = [
    { value: "expense", label: "Expense" },
    { value: "income", label: "Income" },
  ];
  
  const categoryOptions: SelectOption[] = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));
  
  const accountOptions: SelectOption[] = [
    { value: "", label: "None" },
    ...accounts.map((acc) => ({
      value: acc.id,
      label: acc.name,
    })),
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Type"
                options={typeOptions}
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
              />
              
              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
                inputMode="decimal"
              />
              
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
              />
              
              <Select
                label="Category"
                options={categoryOptions}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                error={errors.categoryId}
                placeholder="Select a category"
              />
              
              <Select
                label="Account"
                options={accountOptions}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              
              <Input
                label="Merchant (optional)"
                type="text"
                placeholder="Where did you spend?"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
              />
              
              <Input
                label="Note (optional)"
                type="text"
                placeholder="Additional details"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              
              {errors.submit && (
                <p className="text-sm text-red-600">{errors.submit}</p>
              )}
              
              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => router.back()}
                    disabled={saving || deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    disabled={saving || deleting}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
                
                <Button
                  type="button"
                  variant="danger"
                  fullWidth
                  onClick={handleDelete}
                  disabled={saving || deleting}
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? "Deleting..." : "Delete Transaction"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
