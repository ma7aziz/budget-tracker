You are a senior systems engineer responsible for DATA, OFFLINE SUPPORT,
and APPLICATION INFRASTRUCTURE.

You are building the DATABASE LAYER and PWA INFRASTRUCTURE
for a Personal Budget Tracking Progressive Web App.

–––––––––––––––––
IMPLEMENTATION PLAN (DB/PWA)
–––––––––––––––––
[x] 1. Scaffold DB/PWA module folders and shared types.
[x] 2. Implement Dexie schema, ID generation, and settings helpers.
[x] 3. Build CRUD data access modules for transactions, categories, budgets, accounts.
[x] 4. Add deterministic calculations, analytics, and month/date helpers.
[x] 5. Implement export/import utilities (JSON/CSV) with validation and dedupe.
[x] 6. Add PWA assets (manifest, service worker, iOS install page).
[x] 7. Add Next.js scaffold and PWA registration hooks.
[x] 8. Add data provider abstraction to swap local/remote storage backends.
[x] 9. Document setup/build notes in README (pending app scaffold).
[x] 10. Add demo seed data for local preview.

–––––––––––––––––
CORE RESPONSIBILITIES
–––––––––––––––––
- IndexedDB schema and migrations (Dexie.js)
- Data access layer (CRUD)
- Financial calculations (deterministic)
- Export / import logic
- PWA configuration and offline support

–––––––––––––––––
TECH STACK
–––––––––––––––––
- TypeScript
- Dexie.js for IndexedDB
- next-pwa OR vite-plugin-pwa
- UUID for IDs

–––––––––––––––––
STRICT DATA RULES
–––––––––––––––––
- Monetary values stored as integer cents ONLY
- Dates stored as YYYY-MM-DD strings
- Month keys stored as YYYY-MM
- IndexedDB is the single source of truth
- No floating point math anywhere

–––––––––––––––––
DATABASE SCHEMA (v1)
–––––––––––––––––
Transaction, Category, Budget, Account, Settings
(Use the exact fields defined in AGENTS.md)

–––––––––––––––––
REQUIRED MODULES
–––––––––––––––––
/db
  - schema.ts (Dexie setup + versioning)
  - transactions.ts
  - categories.ts
  - budgets.ts
  - accounts.ts

/services
  - calculations.ts
  - analytics.ts
  - monthHelpers.ts

/utils
  - exportJson.ts
  - importJson.ts
  - exportCsv.ts

–––––––––––––––––
CALCULATIONS
–––––––––––––––––
Implement tested functions for:
- Monthly totals (income, expense, net)
- Category totals per month
- Budget utilization
- Month-over-month delta per category
- Largest transactions per month
- Top merchants per month

–––––––––––––––––
PWA REQUIREMENTS
–––––––––––––––––
- App shell caching
- Offline support
- Proper manifest (icons, theme color)
- Service worker update strategy
- iOS install instructions page

–––––––––––––––––
EXPORT / IMPORT
–––––––––––––––––
- JSON export includes schemaVersion + all tables
- JSON import validates schema + prevents duplicates
- CSV export includes transactions only

–––––––––––––––––
DELIVERABLES
–––––––––––––––––
- Fully functional IndexedDB layer
- Accurate, deterministic calculations
- Working offline PWA
- README with setup + build instructions

DO NOT:
- Build UI components
- Add authentication
- Add backend APIs
- Store data in localStorage
