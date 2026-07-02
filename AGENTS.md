# SmartGym — Agent Context

## Stack
- Expo SDK 57 + React Native 0.86.0 + expo-router v57 (file-based routing)
- TypeScript strict mode
- Zustand 5 + Immer 10 (split stores), AsyncStorage (versioned cache)
- Supabase (PostgreSQL + RLS + Auth + Storage)
- OpenRouter API (LLM integration)
- Apple HealthKit (iOS) + Health Connect (Android)

## Commands
```bash
npm install          # install deps
npx expo start       # dev server
npx expo run:ios     # iOS simulator
npx expo run:android # Android emulator
```

## Structure (v5.0 Architecture)
```
app/                  # Routing
  (tabs)/             # Routines, Explore, History, Measures, More
  auth/               # Auth flow
  exercise/           # Custom exercise CRUD
  routine/            # Routine builder
  workout/            # Active session

components/           # Component library
  ai/                 # Smart routine generator, auto-fill
  health/             # Health sync UI cards
  exercise/           # Form, picker, preview, image loader
  sync/               # Sync status provider

lib/
  api/                # Fetch layer (CMS, Supabase, Sync)
  cache/              # TTL-aware AsyncStorage cache (SWR pattern)
  health/             # Unified HealthService abstraction
  repositories/       # Cache-first data access (Exercise, Routine)
  services/           # Business logic & Sync orchestration
  migration/          # Data migration (v5 -> v6)
  theme.ts            # Design tokens (Colors, Spacing, Radius)

store/                # Split Zustand stores
  exerciseStore.ts    # Catalog + Custom + Favorites
  routineStore.ts     # User routines + Saved programs
  historyStore.ts     # Sessions + Active workout + PRs
  measureStore.ts     # Body measurements
  authStore.ts        # Auth session
  syncStore.ts        # Sync queue & status

supabase/             # SQL migrations, RLS, Indexes
types/                # Global domain interfaces
scripts/cms/          # Google Sheets CMS source
```

## Design tokens (lib/theme.ts)
Always import from `lib/theme.ts`. Never hardcode hex values.
- `Colors.accent` (#00FF9D)
- `Colors.background.primary` (#0A0A0F)

## Rules
- **Dark theme only.**
- **Offline-First:** All writes go to Zustand + Cache first, then queued for Sync.
- **Service-Oriented:** Components call Services/Stores, Services call Repositories, Repositories call API/Cache.
- **Safety:** Always check `settings.isPremium` for AI features. Use `healthService.isAvailable()` before health calls.
- **Sync:** Data with `syncStatus: 'dirty'` is automatically pushed by `SyncProvider`.

## Context Strategy
Ưu tiên dùng vexp tools (`run_pipeline`, `get_context_capsule`) để lấy context thay vì đọc nhiều file.

## Recent changes
```
- [v5.5] Database Seed & Fallback Alignment:
  - Created automatic PostgreSQL SQL seed script for `catalog_exercises` mapping real Unsplash images and stable UUIDs.
  - Saved SQL seed script to `supabase/seed_catalog.sql` for easy manual execution on Supabase SQL Editor.
  - Fixed cache fallback logic in `exerciseRepository.getById` to prevent missing exercises when catalog database has limited entries.
  - Fixed missing `EXERCISE_FALLBACK_IMAGE` import in `exerciseMapper.ts` causing typecheck errors.
- [v5.4] UI & UX Refinement:
  - Deduplicated routines list on the UI to prevent seeding/sync duplicates.
  - Redesigned Coach AI Card with proper card styling (bgCard2, border light, pill button).
  - Fixed corner rounding bug of left color bar in RoutineCard by converting it to a standalone View component.
  - Enhanced floating action button (FAB) shadow effect on dark mode.
- [v5.3] Upgrade Stack:
  - Upgraded Expo to SDK 57 (~57.0.1) and React Native to 0.86.0.
  - Migrated app.json splash screen configuration to the expo-splash-screen config plugin.
  - Converted local JPG assets disguised as PNGs to real PNG files to satisfy expo-doctor asset checks.
  - Resolved deprecated StatusBar backgroundColor prop warning.
  - Fixed StyleSheet.absoluteFillObject references to StyleSheet.absoluteFill for React Native 0.86 compatibility.
  - Resolved miscellaneous TypeScript errors in services/ai/aiService.ts and services/ai/aiUtils.ts.
- [v5.2] UI Redesign:
  - Redesigned `Routines` screen with new Coach AI card, updated header, and full-width Routine cards.
  - Redesigned `Explore` screen with updated Smart Trainer AI card, vertical Featured Programs list, and new Program card layout.
- [v5.0] Production Architecture Refactor:
  - NEW: `types/` — full domain type system.
  - NEW: `supabase/migrations/` — 14 tables, RLS, indexes.
  - NEW: `scripts/cms/` — Google Sheets CMS + Apps Script API.
  - NEW: `lib/cache/` — versioned, TTL-aware AsyncStorage cache (SWR).
  - NEW: `lib/api/` — CMS + Supabase + Sync raw fetch layer.
  - NEW: `lib/repositories/` — cache-first data access.
  - NEW: `lib/services/` — business logic & sync orchestration.
  - NEW: `lib/migration/v6Migration.ts` — automated v5 -> v6 store migration.
  - NEW: `store/` — split Zustand stores for performance and modularity.
  - NEW: `lib/health/` — unified IHealthService (iOS/Android).
  - UPDATED: `lib/exercises.ts` — cloud-aware library helpers.
- [v4.1] Context Efficiency:
  - Adopted `vexp` tools (`capsule`) as primary context gathering mechanism.
- [v4.0] Offline-First Cloud Sync & Health Integration:
  - Sync engine with background recovery.
- [v3.1] AI OpenRouter Migration & Video Enhancements:
- [v5.1] Bug Fixes & Stability:
  - Fixed native crash on Android when checking Health Connect permissions on mount.
  - Fixed soft-deleted routines appearing in the Routines list.
  - Fixed crash when starting a featured program from the Explore tab.
  - Fixed invalid VideoView props and database index errors.
```
