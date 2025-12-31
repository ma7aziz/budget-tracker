# Budget Tracker PWA

Offline-first, single-user personal budget tracker built with Next.js. Data stays on-device in IndexedDB by default, with an optional sync provider.

## Features

- Monthly dashboard summary (income, expenses, net, trends)
- Transactions CRUD with categories and accounts
- Budgets per category with alerts
- Analytics (category breakdown + month-over-month)
- Export (JSON/CSV) and import (JSON)
- PWA install support and full offline use

## Tech Stack

- Next.js 14, React 18, TypeScript, Tailwind CSS
- IndexedDB via Dexie
- Recharts for charts
- Service worker + manifest

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

If you hit the Linux inotify watcher limit, either raise the limit or use polling:

```bash
WATCHPACK_POLLING=true WATCHPACK_POLLING_INTERVAL=1000 npm run dev
```

## Production

```bash
npm run build
npm run start
```

## Data Storage & Formats

- Money stored as integer cents (no floating point math)
- Dates stored as `YYYY-MM-DD`
- Month keys stored as `YYYY-MM`
- IndexedDB is the source of truth in local mode

## Data Providers

The app is offline-first and defaults to IndexedDB storage.

- Local (default): `NEXT_PUBLIC_DATA_PROVIDER=local`
- Remote (stub): `NEXT_PUBLIC_DATA_PROVIDER=remote`
- Supabase (sync): `NEXT_PUBLIC_DATA_PROVIDER=supabase`

## Supabase Setup (Optional)

1. Create a Supabase project and run the SQL in `supabase/schema.sql`.
2. Copy the project URL + anon key into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_DATA_PROVIDER=supabase
```

3. Start the app and visit `/auth` to sign in or create an account.

### Migration Notes (Local → Supabase)

- Local IndexedDB data is preserved.
- On login, local data is merged into Supabase and remote updates are pulled down.
- If you log out, local data stays intact and the app continues to work offline.

## PWA Notes

- Service worker is served from `public/sw.js` and registered on load.
- Manifest is at `public/manifest.json`.
- iOS install instructions live at `public/ios-install.html`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — lint

## License

No license is specified yet. All rights reserved by default.
