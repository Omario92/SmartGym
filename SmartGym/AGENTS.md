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
- [v6.5] Repository Restructuring & Documentation Update:
  - Migrated the Git repository to the root directory to establish a Monorepo containing both the Expo app (`SmartGym`) and the Web Admin Panel (`apps/admin`).
  - Added a root-level `.gitignore` to prevent tracking metadata from local AI agents, IDE configurations, and environment secrets.
  - Updated `SmartGym/README.md` to document feature sets from v6.0 to v6.4 (Icon migrations, 1RM modal UI, Tab bar updates, infinite loop fixes).
  - Created a comprehensive `README.md` for `apps/admin` explaining the React 19 + TypeScript + Vite 8 stack and dynamic drag-and-drop routine builder features.
- [v6.4] More Screen Icon Modernization & SVGs:
  - Converted the raw custom SVG assets to React Native Svg components in `components/ui/MoreIcons.tsx` using SVGR component patterns to avoid native parser exceptions on Fabric renderer.
  - Migrated the "More" tab settings options from raw text emojis to premium vector SVG components.
  - Updated custom exercise, favorites, create exercise, cloud exercises, personal profile, fitness goals, weight unit, rest timer, exercise library, 1RM calculator, and 1RM formula settings rows.
  - Enhanced the `SettingRow` component to support rendering both emojis (as string) and SVG icons (as React Component types).
- [v6.3] Tab Bar UI Tweaks & Measure Delete Bug Fix:
  - Removed the active tab background highlight pill in `components/ui/GlassTabBar.tsx` so only active icons and labels light up.
  - Fixed soft-deleted body measurement records showing up in the UI logs and charts by filtering them in `app/(tabs)/measures.tsx`.
- [v6.2] Icon System Migration to `@expo/vector-icons` (Ionicons):
  - Completely replaced `lucide-react-native` with `@expo/vector-icons` (Ionicons) to unify iconography and resolve Metro bundler ESM resolution errors.
  - Simplified `components/ui/Icon.tsx` by removing the manual mapping layer, as all UI icons already use Ionicons-compatible names.
  - Retained custom SVGs for fitness/anatomy graphics via `FITNESS_ICONS`.
  - Uninstalled `lucide-react-native` package and verified clean TypeScript compilation.
- [v6.1] Admin Dashboard Tab-Switch State Reset Fix:
  - Resolved issue where switching browser tabs and returning reloaded/unmounted the entire dashboard layout, causing data loss for unsaved forms.
  - Implemented `profileRef` in `App.tsx` to safely handle non-stale closures inside the Supabase `onAuthStateChange` listener.
  - Added a `silent` option to `checkAdminStatus` to allow authentication state checking and token refreshes in the background without triggering full-screen blocker UI or layout resets.
- [v6.0] Fix Infinite Update Render Loop:
  - Resolved "Maximum update depth exceeded" crash by refactoring `SyncProvider.tsx` to read/write `syncStatus` on-demand via `useStore.getState()` instead of subscribing to state transitions.
  - Eliminated the unsubscribe-subscribe loop with NetInfo's immediate callback firing during render-time effect mounts.
- [v5.9] TypeScript Typecheck Alignment:
  - Resolved `StyleSheet.absoluteFillObject` references to `StyleSheet.absoluteFill` in `app/(tabs)/explore.tsx`, `app/(tabs)/index.tsx`, and `components/ui/GlassTabBar.tsx` for React Native 0.86 compatibility.
  - Fixed type error in `app/_layout.tsx` where Supabase query returns a `PromiseLike` without `.catch` by migrating from `.then().catch()` to the standard two-argument `.then(onfulfilled, onrejected)` form.
  - Verified successful compilation under TypeScript strict check using `npm run typecheck` with zero remaining errors.
- [v6.0] Weight Unit Conversions & Custom 1RM Formula UI:
  - Fixed infinite update render loop by removing `syncStatus` dependency in `SyncProvider.tsx`.
  - Created weight unit conversion utility (`lib/unit.ts`) for on-the-fly kg/lbs conversion.
  - Implemented dynamic weight display and edits across routines list preview, active workout logging, history/charts, body measurements tracking, exercise PRs, and AI routine generator preview.
  - Redesigned 1RM Formula selection from native Alert to custom dark premium themed modal (`components/ui/OneRMFormulaModal.tsx`).
- [v5.8] Admin Dashboard Web Panel:
  - Created standalone React + TypeScript + Vite web app under `apps/admin` for Exercise Catalog and Routine Template administration.
  - Implemented secure Supabase Auth login, stats overview, listing tables with CSV/JSON import/export, and settings pages.
  - Built interactive Drag-and-drop Routine Builder supporting Flat Workouts and Multi-Day Programs with dynamic parameters (tempo, RPE, rest, reps, sets).
  - Created Supabase migration `006_admin_dashboard.sql` defining new database structures and secure admin-only RLS write policies.
  - Resolved all TypeScript strict check warnings and completed build verification with clean linter status.
- [v5.7] Lint and Typecheck Fixes & Dependency Alignment:
  - Resolved all React hook purity issues by moving non-idempotent `Date.now()` calls inside callbacks/handlers to an external helper (`generateSavedId`).
  - Resolved all `react-hooks/set-state-in-effect` errors by wrapping synchronous React state changes inside `useEffect` in `queueMicrotask`.
  - Cleared all 7 lint errors across `explore.tsx`, `_layout.tsx`, `[id].tsx`, `active.tsx`, and `AIGeneratorModal.tsx`.
  - Updated Expo SDK 57 packages (`expo-build-properties`, `expo-image-picker`, `expo-media-library`, `expo-notifications`, and `expo-router`) to their recommended versions using `npx expo install --fix`.
- [v5.6] Auth Flow & Premium UI Enhancements:
  - Added new Forgot Password screen (`app/auth/forgot-password.tsx`) with Supabase email reset password logic.
  - Premium redesign of Login, Register and Forgot Password screens with nested gradient borders, custom SVGs, and gold branding accents (#FFD36A).
  - Modernized Routines, Explore, History, Measures, and More tab layouts with Space Grotesk display font and GlowOrb neon glow backdrops.
  - Integrated `@expo-google-fonts/space-grotesk` for improved typography across screens.
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


## vexp <!-- vexp v2.1.0 -->

**MANDATORY: use `run_pipeline` - do NOT grep or glob the codebase.**
vexp returns pre-indexed, graph-ranked context in a single call.

### Workflow
1. `run_pipeline` with your task description - ALWAYS FIRST (replaces all other tools)
2. Make targeted changes based on the context returned
3. `run_pipeline` again only if you need more context

### Available MCP tools
- `run_pipeline` - **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Auto-detects intent. Includes file content. Example: `run_pipeline({ "task": "fix auth bug" })`
- `get_skeleton` - compact file structure
- `index_status` - indexing status
- `expand_vexp_ref` - expand V-REF placeholders in v2 output

### Agentic search
- Do NOT use built-in file search, grep, or codebase indexing - always call `run_pipeline` first
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  rather than letting them search the codebase independently

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->