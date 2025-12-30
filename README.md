# Budget Tracker PWA

Offline-first, single-user personal budget tracker built with Next.js, IndexedDB (Dexie), and a PWA service worker.

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

## Data Provider

The app is offline-first and defaults to IndexedDB storage. The data provider can be swapped later for a remote backend.

- Local (default): `NEXT_PUBLIC_DATA_PROVIDER=local`
- Remote (stub): `NEXT_PUBLIC_DATA_PROVIDER=remote`

## PWA Notes

- Service worker is served from `public/sw.js` and registered on load.
- Manifest is at `public/manifest.json`.
- iOS install instructions live at `public/ios-install.html`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — lint
