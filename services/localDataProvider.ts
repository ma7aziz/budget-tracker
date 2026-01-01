import {
  addTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  listTransactionsByAccount,
  listTransactionsByCategory,
  listTransactionsByDateRange,
  listTransactionsByMonth,
  updateTransaction,
} from "../db/transactions";
import {
  addCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
  updateCategoryOrder,
} from "../db/categories";
import {
  addBudget,
  deleteBudget,
  getBudget,
  getBudgetForMonthCategory,
  listBudgets,
  listBudgetsForMonth,
  updateBudget,
  upsertBudgetForMonth,
} from "../db/budgets";
import {
  addMonthlyBudget,
  deleteMonthlyBudget,
  getMonthlyBudget,
  getMonthlyBudgetForMonth,
  listMonthlyBudgets,
  listMonthlyBudgetsForMonth,
  updateMonthlyBudget,
  upsertMonthlyBudgetForMonth,
} from "../db/monthlyBudgets";
import {
  addAccount,
  deleteAccount,
  getAccount,
  listAccounts,
  updateAccount,
} from "../db/accounts";
import {
  addRecurringTemplate,
  deleteRecurringTemplate,
  getRecurringTemplate,
  listRecurringTemplates,
  updateRecurringTemplate,
} from "../db/recurringTemplates";
import { getSettings, resetSettings, setSettings } from "../db/settings";
import { exportJson } from "../utils/exportJson";
import { importJson } from "../utils/importJson";
import { exportTransactionsCsvFromDb } from "../utils/exportCsv";
import type { DataProvider } from "./dataProvider";

export function createLocalDataProvider(): DataProvider {
  return {
    kind: "local",
    transactions: {
      add: addTransaction,
      get: getTransaction,
      update: updateTransaction,
      delete: deleteTransaction,
      list: listTransactions,
      listByDateRange: listTransactionsByDateRange,
      listByMonth: listTransactionsByMonth,
      listByAccount: listTransactionsByAccount,
      listByCategory: listTransactionsByCategory,
    },
    categories: {
      add: addCategory,
      get: getCategory,
      update: updateCategory,
      delete: deleteCategory,
      list: listCategories,
      updateOrder: updateCategoryOrder,
    },
    budgets: {
      add: addBudget,
      get: getBudget,
      getForMonthCategory: getBudgetForMonthCategory,
      upsertForMonth: upsertBudgetForMonth,
      update: updateBudget,
      delete: deleteBudget,
      list: listBudgets,
      listForMonth: listBudgetsForMonth,
    },
    monthlyBudgets: {
      add: addMonthlyBudget,
      get: getMonthlyBudget,
      getForMonth: getMonthlyBudgetForMonth,
      upsertForMonth: upsertMonthlyBudgetForMonth,
      update: updateMonthlyBudget,
      delete: deleteMonthlyBudget,
      list: listMonthlyBudgets,
      listForMonth: listMonthlyBudgetsForMonth,
    },
    accounts: {
      add: addAccount,
      get: getAccount,
      update: updateAccount,
      delete: deleteAccount,
      list: listAccounts,
    },
    recurringTemplates: {
      add: addRecurringTemplate,
      get: getRecurringTemplate,
      update: updateRecurringTemplate,
      delete: deleteRecurringTemplate,
      list: listRecurringTemplates,
    },
    settings: {
      get: getSettings,
      set: setSettings,
      reset: resetSettings,
    },
    exportJson,
    importJson,
    exportCsv: exportTransactionsCsvFromDb,
  };
}
