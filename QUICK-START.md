# 🚀 Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- npm or yarn

## Installation & Setup

```bash
# Navigate to project
cd /home/mahmoud/Desktop/Work/budget-tracker

# Dependencies already installed, but if needed:
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## First Time Setup

### 1. Add Categories (Required)
- Go to **Settings** (bottom nav or sidebar)
- Click **"Add Category"**
- Enter name (e.g., "Groceries", "Rent", "Transport")
- Pick a color
- Click **"Add"**
- Repeat for all your expense categories

### 2. Add Accounts (Optional)
- In **Settings**, scroll to "Accounts"
- Click **"Add Account"**
- Enter name (e.g., "Chase Checking", "Cash Wallet")
- Select type (Bank, Cash, Card, Wallet)
- Click **"Add"**

### 3. Add Your First Transaction
- Click the **+ button** (bottom right on mobile, or from dashboard)
- Select **Type** (Expense or Income)
- Enter **Amount** (e.g., 45.99)
- Select **Date** (defaults to today)
- Choose **Category**
- Optional: Select account, add merchant, add note
- Click **"Save"**

### 4. Set Monthly Budgets
- Go to **Budgets** page
- Click **"Add Budget"**
- Select a category
- Enter budget limit (e.g., 500 for groceries)
- Click **"Save Budget"**
- Repeat for other categories

### 5. View Your Data
- **Dashboard**: See monthly summary and recent transactions
- **Transactions**: Browse all transactions with filters
- **Budgets**: Track spending vs limits
- **Analytics**: View charts and insights

## Tips

### Mobile Usage
- Use the bottom navigation for quick switching
- The **+ button** is always accessible for quick entry
- Swipe-friendly transaction lists

### Data Management
- **Export**: Settings > Export JSON/CSV for backup
- **Import**: Settings > Import JSON to restore data
- **Reset**: Settings > Delete All Data (use with caution!)

### Budgeting Strategy
1. Add all your common categories
2. Track expenses for a week without budgets
3. Review spending in Analytics
4. Set realistic budgets based on patterns
5. Monitor progress in Budgets page

### Best Practices
- ✅ Add transactions immediately after spending
- ✅ Use merchant names for better tracking
- ✅ Review Analytics monthly to spot trends
- ✅ Export data regularly for backup
- ✅ Set realistic budgets based on history

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Troubleshooting

### "No categories" error when adding transaction
→ Go to Settings and add at least one category first

### Charts not showing in Analytics
→ Add some transactions first (need data to visualize)

### Build warnings about themeColor
→ These are just deprecation warnings, app works fine

### Need to reset everything
→ Settings > Delete All Data (confirms twice for safety)

## Project Structure Overview

```
app/              → Pages (Dashboard, Transactions, etc.)
components/       → Reusable UI components
  ├── ui/        → Base components (Button, Input, etc.)
  ├── layout/    → Navigation components
  └── dashboard/ → Dashboard-specific components
db/              → Database schema & models
services/        → Business logic & data providers
utils/           → Helper functions (formatting, export, etc.)
```

## Key Features

✅ Offline-first (works without internet)  
✅ PWA installable (Add to Home Screen)  
✅ Mobile-optimized interface  
✅ Real-time budget tracking  
✅ Visual analytics with charts  
✅ Data export/import  
✅ Full data ownership (stored locally)  

## Support

For issues or questions:
1. Check the UI-IMPLEMENTATION.md for detailed docs
2. Review AGENTS.md for architecture overview
3. See BUILD-COMPLETE.md for implementation details

---

**You're ready to start tracking your budget! 💰**
