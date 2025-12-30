"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, SelectOption } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/Loading";
import { getDataProvider } from "@/services/dataProvider";
import { Category, Account, TransactionType } from "@/db/schema";
import { parseCentsInput } from "@/utils/formatting";

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    try {
      setLoading(true);
      const provider = getDataProvider();
      
      const [cats, accs] = await Promise.all([
        provider.categories.list(),
        provider.accounts.list(),
      ]);
      
      setCategories(cats);
      setAccounts(accs);
      
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
      
      if (accs.length > 0) {
        setAccountId(accs[0].id);
      }
    } catch (error) {
      console.error("Failed to load form data:", error);
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
      
      await provider.transactions.add({
        type,
        amountCents,
        date,
        categoryId,
        accountId: accountId || null,
        merchant: merchant || null,
        note: note || null,
      });
      
      router.push("/");
    } catch (error) {
      console.error("Failed to save transaction:", error);
      setErrors({ submit: "Failed to save transaction" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
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
            <CardTitle>Add Transaction</CardTitle>
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
                autoFocus
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
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
