import type { DataProvider } from "./dataProvider";
import { createLocalDataProvider } from "./localDataProvider";
import { triggerSync } from "./supabaseSync";

export function createSupabaseDataProvider(): DataProvider {
  const local = createLocalDataProvider();

  return {
    kind: "supabase",
    transactions: {
      add: async (input) => {
        const result = await local.transactions.add(input);
        triggerSync();
        return result;
      },
      get: local.transactions.get,
      update: async (id, updates) => {
        const result = await local.transactions.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.transactions.delete(id);
        triggerSync();
      },
      list: local.transactions.list,
      listByDateRange: local.transactions.listByDateRange,
      listByMonth: local.transactions.listByMonth,
      listByAccount: local.transactions.listByAccount,
      listByCategory: local.transactions.listByCategory,
    },
    categories: {
      add: async (input) => {
        const result = await local.categories.add(input);
        triggerSync();
        return result;
      },
      get: local.categories.get,
      update: async (id, updates) => {
        const result = await local.categories.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.categories.delete(id);
        triggerSync();
      },
      list: local.categories.list,
      updateOrder: async (id, order) => {
        const result = await local.categories.updateOrder(id, order);
        triggerSync();
        return result;
      },
    },
    budgets: {
      add: async (input) => {
        const result = await local.budgets.add(input);
        triggerSync();
        return result;
      },
      get: local.budgets.get,
      getForMonthCategory: local.budgets.getForMonthCategory,
      upsertForMonth: async (monthKey, categoryId, limitCents) => {
        const result = await local.budgets.upsertForMonth(monthKey, categoryId, limitCents);
        triggerSync();
        return result;
      },
      update: async (id, updates) => {
        const result = await local.budgets.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.budgets.delete(id);
        triggerSync();
      },
      list: local.budgets.list,
      listForMonth: local.budgets.listForMonth,
    },
    monthlyBudgets: {
      add: async (input) => {
        const result = await local.monthlyBudgets.add(input);
        triggerSync();
        return result;
      },
      get: local.monthlyBudgets.get,
      getForMonth: local.monthlyBudgets.getForMonth,
      upsertForMonth: async (monthKey, limitCents) => {
        const result = await local.monthlyBudgets.upsertForMonth(monthKey, limitCents);
        triggerSync();
        return result;
      },
      update: async (id, updates) => {
        const result = await local.monthlyBudgets.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.monthlyBudgets.delete(id);
        triggerSync();
      },
      list: local.monthlyBudgets.list,
      listForMonth: local.monthlyBudgets.listForMonth,
    },
    accounts: {
      add: async (input) => {
        const result = await local.accounts.add(input);
        triggerSync();
        return result;
      },
      get: local.accounts.get,
      update: async (id, updates) => {
        const result = await local.accounts.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.accounts.delete(id);
        triggerSync();
      },
      list: local.accounts.list,
    },
    recurringTemplates: {
      add: async (input) => {
        const result = await local.recurringTemplates.add(input);
        triggerSync();
        return result;
      },
      get: local.recurringTemplates.get,
      update: async (id, updates) => {
        const result = await local.recurringTemplates.update(id, updates);
        triggerSync();
        return result;
      },
      delete: async (id) => {
        await local.recurringTemplates.delete(id);
        triggerSync();
      },
      list: local.recurringTemplates.list,
    },
    settings: {
      get: local.settings.get,
      set: async (updates) => {
        const result = await local.settings.set(updates);
        triggerSync();
        return result;
      },
      reset: async () => {
        const result = await local.settings.reset();
        triggerSync();
        return result;
      },
    },
    exportJson: local.exportJson,
    importJson: async (payload) => {
      const report = await local.importJson(payload);
      triggerSync();
      return report;
    },
    exportCsv: local.exportCsv,
  };
}
