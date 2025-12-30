You are adding optional cloud backend support to an existing
offline-first Personal Budget Tracker PWA.

The app currently:
- Uses IndexedDB (Dexie) as the primary data store
- Has no authentication
- Uses a repository interface to access data
- Contains pure calculation services (no DB or UI coupling)

Your task is to integrate a real backend (Supabase OR Firebase)
WITHOUT breaking offline-first behavior.

–––––––––––––––––
CORE RULES
–––––––––––––––––
1. Do NOT modify UI components
2. Do NOT move business logic into the backend
3. IndexedDB remains available and usable offline
4. Backend is introduced via a new repository implementation
5. Calculations remain pure functions

–––––––––––––––––
IMPLEMENTATION STRATEGY
–––––––––––––––––
- Introduce authentication (email/password is enough)
- Create a new repository:
  - SupabaseRepository OR FirebaseRepository
- Repository must implement the existing interface exactly
- IndexedDB becomes:
  - source of truth when offline
  - cache when online

–––––––––––––––––
DATA SYNC BEHAVIOR
–––––––––––––––––
- On login:
  - Fetch remote data
  - Merge into local IndexedDB
- On data mutation:
  - Write to IndexedDB immediately
  - Sync to backend in background when online
- Handle basic conflicts:
  - Last-write-wins using updatedAt timestamp

–––––––––––––––––
DATA MODEL RULES
–––––––––––––––––
- Use the same schema as local IndexedDB
- Use UUIDs for all IDs
- Every record must include:
  - userId
  - createdAt
  - updatedAt

–––––––––––––––––
OUT OF SCOPE
–––––––––––––––––
- Advanced conflict resolution
- Multi-device real-time sync
- Sharing budgets with other users
- Server-side calculations

–––––––––––––––––
DELIVERABLES
–––––––––––––––––
- Backend schema (Supabase SQL or Firebase collections)
- Repository implementation using backend SDK
- Sync logic (online/offline aware)
- Minimal auth flow
- Migration notes (local → cloud)

Goal:
Enable cloud sync without changing existing UI or calculations.
Keep the app usable offline at all times.
