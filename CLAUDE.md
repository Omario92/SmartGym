# SmartGym — Agent Context

## Stack
- Expo SDK 55 + React Native 0.76.5 + expo-router v4 (file-based routing)
- TypeScript strict mode
- Zustand 5 + Immer 10 (state), AsyncStorage (persistence)
- react-native-reanimated + gesture-handler (animations)
- react-native-svg (charts), @expo/vector-icons/Ionicons

## Commands
```
npm install          # install deps
npx expo start       # dev server
npx expo run:ios     # iOS simulator
npx expo run:android # Android emulator
```
No custom scripts beyond these. Package manager: npm.

## Structure
```
app/
  _layout.tsx          # root layout, triggers first-launch tour
  (tabs)/
    _layout.tsx        # bottom tab navigator (5 tabs)
    index.tsx          # Routines tab
    explore.tsx        # Explore tab
    history.tsx        # History & analytics
    measures.tsx       # Body measurements
    more.tsx           # Settings
  routine/
    create.tsx         # new routine (modal)
    [id].tsx           # edit routine
  workout/
    active.tsx         # live session (full-screen modal)
    all-exercises.tsx  # Exercise Library v1.5

components/
  exercise/
    ExerciseImage.tsx        # shimmer image loader
    ExerciseDetailModal.tsx  # exercise detail view
  tour/GuidedTour.tsx        # 7-step spotlight onboarding
  ui/
    Text.tsx, Card.tsx, Button.tsx
    ProgressRing.tsx, Badge.tsx, EmptyState.tsx

lib/
  theme.ts      # design tokens — import from here, never hardcode colors
  exercises.ts  # 35+ exercise library with metadata

store/
  index.ts      # single Zustand store (routines, workouts, history, measures)
```

## Design tokens (lib/theme.ts)
```ts
Colors.accent              = '#00FF9D'  // neon green — primary CTA
Colors.background.primary  = '#0A0A0F'
Colors.background.card     = '#13131A'
Colors.text.primary        = '#FFFFFF'
Colors.text.secondary      = '#A0A0B8'
```
Always import from `lib/theme.ts`. Never hardcode hex values elsewhere.

## Rules
- Dark theme only — no light mode variants
- All colors via `lib/theme.ts` tokens
- Icons: Ionicons from @expo/vector-icons only
- State mutations via Zustand + Immer — never mutate directly
- File-based routing via expo-router — match existing route conventions
- Do NOT touch `store/index.ts` structure without reading it first
- Do NOT add new navigation tabs without updating `app/(tabs)/_layout.tsx`

## Known limitations (not yet implemented)
- Persistence is Zustand in-memory only (no SQLite yet)
- No real AI — Smart Trainer is a PRO teaser UI
- No push notifications, no cloud backup, no health app sync
- No in-app purchases

## Context Strategy
Ưu tiên dùng vexp tools (`run_pipeline`, `get_context_ca