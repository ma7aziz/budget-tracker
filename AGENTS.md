# AGENTS.md — Budget Tracker PWA

## Purpose
Single-user, offline-first Personal Budget Tracking Progressive Web App (PWA).

No backend.
No authentication.
All data stored locally on the device.

---

## Core Principles
- Offline-first
- Fast expense entry
- Deterministic financial calculations
- Full data ownership (export/import)
- Mobile-first UX

---

## Tech Stack
- React + TypeScript
- Tailwind CSS
- IndexedDB via Dexie.js
- Recharts
- PWA via service worker + manifest

---

## Data Rules (NON-NEGOTIABLE)
- Money stored as integer cents
- Dates stored as `YYYY-MM-DD`
- Month keys stored as `YYYY-MM`
- IndexedDB is the single source of truth
- No floating-point money math

---

## Database Schema (v1)

### Transaction
- id (uuid)
- type: expense | income
- amountCents
- date (YYYY-MM-DD)
- categoryId
- accountId (nullable)
- merchant (nullable)
- note (nullable)
- createdAt
- updatedAt

### Category
- id
- name
- parentId (nullable)
- order
- color (nullable)

### Budget
- id
- month (YYYY-MM)
- categoryId
- limitCents

### Account
- id
- name
- type (cash | bank | card | wallet)

### Settings
- currency
- locale
- weekStart
- theme

---

## Required Features
- Dashboard (monthly summary)
- Transactions CRUD
- Budgets per category
- Analytics (category + MoM)
- Export (JSON, CSV)
- Import (JSON)
- PWA install support

---

## Agent Boundaries
- UI agent: UI, components, layouts only
- DB/PWA agent: storage, calculations, service worker only
- No cross-responsibility code

---

## Out of Scope (MVP)
- Authentication
- Cloud sync
- Bank integrations
- Forecasting
- Investments
