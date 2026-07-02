# SmartGym 💪

A **premium, production-ready fitness tracking app** built with Expo SDK 57 + React Native 0.86.0.

## ✨ Features

- **v5.5 Database Seed & Fallback Alignment** — Automatic PostgreSQL SQL seed script for catalog exercises, and improved cache fallback logic for offline reliability.
- **v5.4 UI & UX Refinement** — Coach AI Card styling redesign, routine list deduplication, and custom UI components like RoutineCard updates.
- **v5.3 Upgrade Stack** — Expo SDK 57, React Native 0.86.0, and TS compilation fixes.
- **v5.2 UI Redesign** — Redesigned Routines & Explore screen layouts with custom cards and featured lists.
- **v5.1 Stability & Bug Fixes** — Resolved critical native Android crashes with Health Connect, fixed UI rendering bugs for soft-deleted routines, and addressed type mismatches in Explore screens.
- **v5.0 Production Architecture** — Scalable multi-layer architecture: Domain Types → API → Cache → Repository → Service → Store.
- **v4.0 Offline-First Cloud Sync** — Robust synchronization engine with conflict resolution, background sync, and exponential backoff retry queue.
- **v3.1 AI Smart Trainer** — AI routine generator and auto-fill capabilities via **OpenRouter** (Gemini, Claude, GPT-4, Llama support).
- **v3.0 Health Integration** — Cross-platform health sync supporting **Apple HealthKit** (iOS) and **Health Connect** (Android).
- **v2.5 Google Sheets CMS** — Admin-managed exercise and routine library powered by Google Sheets and Apps Script.
- **v2.1 Cloud Custom Exercises** — Supabase backend to sync, create, edit, and share custom exercises with **Full Video Support**.
- **Full Routine Builder** — Create workouts with exercises, sets, reps, weight, and per-exercise rest timers.
- **1RM Calculator** — Integrated calculator for One-Rep Max with safety percentages.
- **Premium Exercise Library** — 500+ potential exercises (via CMS) with high-resolution images and videos.
- **Advanced Search & Filter** — Deep filtering by muscle group, difficulty, and equipment.
- **Live Workout Session** — Set-by-set logging with animated progress and auto-start rest timers.
- **Guided Onboarding Tour** — 7-step spotlight tour for new users.
- **History & Analytics** — Weekly volume charts, heatmap, and monthly summary logs.
- **Body Measurements** — Track 9 body metrics with interactive trend charts.
- **Premium Design** — Sleek dark mode with neon green accent (#00FF9D) and glassmorphism UI.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android
```

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo SDK 57 + expo-router (SDK 57) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **CMS** | Google Sheets + Apps Script API |
| **AI Service** | OpenRouter (Unified API for GPT/Claude/Gemini) |
| **State** | Zustand 5 (Split Domain Stores) + Immer 10 |
| **Health** | react-native-health (iOS) + react-native-health-connect (Android) |
| **Storage** | AsyncStorage (Versioned Cache) + Supabase |
| **Styling** | StyleSheet (Theme-driven Design System) |
| **Video/Image** | expo-video + expo-image |
| **Animations** | react-native-reanimated + gesture-handler |

## 📁 Project Structure (v5.0)

```
SmartGym/
├── app/                  # File-based routing (Tabs, Auth, CRUD)
├── components/           # UI components, AI tools, health cards
├── lib/
│   ├── api/              # Raw data fetch layer (CMS, Supabase)
│   ├── cache/            # TTL-aware AsyncStorage cache with SWR
│   ├── health/           # Platform-agnostic health abstraction
│   ├── repositories/     # Cache-first data access layer
│   ├── services/         # Business logic & sync orchestration
│   ├── migration/        # One-time data migration scripts
│   └── theme.ts          # Centralized Design System tokens
├── store/                # Split Zustand stores (History, Routine, Exercise, etc.)
├── supabase/             # SQL migrations and RLS policies
├── types/                # Unified domain TypeScript interfaces
└── scripts/              # CMS schemas and Apps Script source
```

## 🏋️ Workout Flow

1. **Routines tab** → Select or create a routine.
2. **Active Workout** → Log sets, weights, and reps.
3. **Rest Timer** → Auto-starts after marking a set complete.
4. **Finish** → Calculates 1RM PRs and saves to cloud-synced history.

## 📦 Environment Variables

Create a `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_CMS_BASE_URL=your_apps_script_url
EXPO_PUBLIC_AI_PROVIDER=openrouter
EXPO_PUBLIC_OPENROUTER_API_KEY=your_key
```

## 📄 License

MIT — Built with ❤️ for the fitness community.
