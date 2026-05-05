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
  auth/
    login.tsx, register.tsx  # Email / Google / Apple Sign In
  exercise/
    create.tsx, [id].tsx     # Cloud exercise CRUD

components/
  ai/
    AIGeneratorModal.tsx      # Feature 1: AI Routine Generator (multi-step modal)
    AIExerciseFillButton.tsx  # Feature 2: Auto-fill exercise form button
  exercise/
    ExerciseImage.tsx        # shimmer image loader
    ExerciseDetailModal.tsx  # exercise detail view
    ExerciseForm.tsx         # controlled form (react-hook-form)
    ExerciseMediaPicker.tsx, ExerciseMediaPreview.tsx
  tour/GuidedTour.tsx        # 7-step spotlight onboarding
  ui/
    Text.tsx, Card.tsx, Button.tsx
    ProgressRing.tsx, Badge.tsx, EmptyState.tsx, LineChart.tsx

lib/
  theme.ts            # design tokens — import from here, never hardcode colors
  exercises.ts        # 35+ exercise library with metadata
  supabase.ts         # Supabase client
  supabaseTypes.ts    # DB row types, CloudExercise, AuthUser
  exerciseMapper.ts   # DB row ↔ app type converters
  exerciseService.ts  # React Query hooks for cloud exercises
  mediaUploadService.ts
  1rm.ts              # Epley, Brzycki, Lombardi 1RM formulas

services/
  ai/
    aiService.ts   # Gemini REST client — generateRoutine, generateExerciseFill, generateSmartWeeklyPlan, validateGeminiKey
    aiUtils.ts     # buildAIContext (store → AIBuildContext), inferFocusMuscles, isAIProfileComplete
    types.ts       # AIUserProfile, AIBuildContext, AIGeneratedRoutine, AIExerciseFill, AISmartWeeklyPlan, AIServiceError
    prompts.ts     # Prompt builders for each AI feature

store/
  index.ts      # single Zustand store v6 (routines, workouts, history, measures, auth, AI)
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
- AI calls must go through `services/ai/aiService.ts` only — never fetch Gemini directly from components
- Gemini API key is user-owned; read from `settings.geminiApiKey`, validated via `validateGeminiKey()`
- All AI features are Pro-gated: check `settings.isPremium` before calling any AI function

## Known limitations (not yet implemented)
- Persistence is Zustand + AsyncStorage (no SQLite yet)
- AI requires user's own Google Gemini API key (Settings → AI)
- No push notifications, no health app sync
- No in-app purchases

## Context Strategy
Ưu tiên dùng vexp tools (`run_pipeline`, `get_context_capsule`) để lấy context thay vì đọc nhiều file.

## Recent changes
<!-- Update this section after each significant edit -->
```
- [v3.1] AI OpenRouter Migration & Video Enhancements:
  - Migrated AI Service from hardcoded Google Gemini to **OpenRouter** (OpenAI-style API support).
  - Updated aiService.ts: added callAI<T> (OpenRouter support), made mapHttpError provider-agnostic.
  - Updated .env: added EXPO_PUBLIC_AI_PROVIDER and EXPO_PUBLIC_OPENROUTER_API_KEY.
  - Installed expo-video, expo-video-thumbnails, and expo-image.
  - Enhanced mediaUploadService.ts: switched from base64 to **Blob/FormData** for large video support; added automatic thumbnail generation for videos.
  - Updated app/exercise/[id].tsx: added **Native Video Hero** support using expo-video.
  - Updated AIGeneratorModal.tsx: improved env var handling to prioritize .env keys over persisted state.
- [v3.0] AI Smart Trainer — Initial Google Gemini integration (Pro only):
  - Created services/ai/types.ts, prompts.ts, aiService.ts, aiUtils.ts.
  - Created components/ai/AIGeneratorModal.tsx, AIExerciseFillButton.tsx.
- [v2.1] Cloud Backend (Supabase) Integration:
  - Synced Cloud Exercises, created lib/supabase.ts, mediaUploadService.ts.
  - Created app/auth, app/exercise screens.
- [v2.6] UI/UX Refinements & Quality of Life:
  - Custom Rest Time, Line Chart scaling, Slide-to-delete.
- [v2.5] Implemented 1RM Tracking & Strength Progress.
- [v2.0.0] Initial publishing with 1RM Calculator and UI refinements.
- [v2.5.1] Bug Fixes: Narrowing issue, ResourceException, shared-testutil.jar fix.
```

