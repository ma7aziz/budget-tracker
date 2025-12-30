You are integrating Supabase into an existing offline-first
Personal Budget Tracker PWA.

The app already exists and has:
- React + TypeScript frontend
- IndexedDB (Dexie) as local storage
- Repository abstraction for data access
- Pure calculation services (no DB/UI coupling)
- Export/import working
- No backend previously

Your task is to add Supabase as a REAL BACKEND
while preserving offline-first behavior.

–––––––––––––––––
CORE RULES (NON-NEGOTIABLE)
–––––––––––––––––
1. Do NOT rewrite UI components
2. Do NOT move calculations to the backend
3. Do NOT remove IndexedDB
4. Supabase must be integrated via a new repository implementation
5. App must still work offline

–––––––––––––––––
ARCHITECTURE
–––––––––––––––––
- IndexedDB remains:
  - primary store when offline
  - immediate write target always
- Supabase becomes:
  - source of truth when online
  - sync target in background

Use this pattern:
UI → Repository Interface → (IndexedDB + Supabase)

–––––––––––––––––
AUTHENTICATION
–––––––––––––––––
- Implement Supabase Auth (email/password only)
- On login:
  - associate local data with user
  - sync local IndexedDB → Supabase
- On logout:
  - clear auth state
  - keep local data intact

–––––––––––––––––
DATABASE SCHEMA (SUPABASE)
–––––––––––––––––
Create Postgres tables mirroring local schema exactly.

All tables must include:
- id (uuid, primary key)
- user_id (uuid, references auth.users)
- created_at (timestamptz)
- updated_at (timestamptz)

Tables:
- transactions
- categories
- budgets
- monthly_budgets
- accounts
- settings

–––––––––––––––––
ROW LEVEL SECURITY (RLS)
–––––––––––––––––
Enable RLS on all tables.

Policy:
- A user can SELECT/INSERT/UPDATE/DELETE
  only rows where user_id = auth.uid()

No client-side filtering is allowed.

–––––––––––––––––
REPOSITORY IMPLEMENTATION
–––––––––––––––––
- Create SupabaseRepository implementing existing repository interface
- Do NOT change method signatures
- All methods must:
  - write to IndexedDB immediately
  - sync to Supabase if online

–––––––––––––––––
SYNC STRATEGY (SIMPLE, SAFE)
–––––––––––––––––
- Use last-write-wins conflict resolution
- Compare updated_at timestamps
- On login:
  - fetch remote data
  - merge into local DB
- On reconnect:
  - push unsynced local changes

No real-time subscriptions in MVP.

–––––––––––––––––
PERFORMANCE CONSTRAINTS
–––––––––––––––––
- Index critical columns:
  - user_id
  - date
  - category_id
  - (user_id, date)
- Fetch only required columns
- Paginate transaction lists
- Do NOT block UI on network calls

–––––––––––––––––
OUT OF SCOPE
–––––––––––––––––
- Shared budgets
- Multi-device real-time sync
- Advanced conflict resolution
- Server-side analytics
- Admin dashboards

–––––––––––––––––
DELIVERABLES
–––––––––––––––––
1. Supabase SQL schema
2. RLS policies
3. SupabaseRepository implementation
4. Auth integration (minimal UI hooks)
5. Sync logic (online/offline aware)
6. Migration notes (local-only → authenticated user)

GOAL:
Add Supabase support without breaking offline-first UX
or changing existing UI and calculation logic.

–––––––––––––––––
IMPLEMENTATION PLAN (SUPABASE)
–––––––––––––––––
[x] 1. Add Supabase client setup, env vars, and package dependency.
[x] 2. Ship Supabase SQL schema + RLS policies for all tables.
[x] 3. Implement auth helpers (email/password) with session handling.
[x] 4. Build sync layer (pull remote, merge local, push local) with LWW timestamps.
[x] 5. Add Supabase repository wrapping local IndexedDB writes + background sync.
[x] 6. Add minimal auth UI hook/page and online sync listener (no UI rewrites).
[x] 7. Update docs/env examples for Supabase configuration + migration notes.
[x] 8. Add auth gate to block anonymous usage when Supabase is enabled.
