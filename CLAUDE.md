# SmartGym — Agent Context

## Stack
- Expo SDK 55 + React Native 0.76.5 + expo-router v4 (file-based routing)
- TypeScript strict mode
- Zustand 5 + Immer 10 (state), AsyncStorage (persistence)
- react-native-reanimated 4.2.1 + gesture-handler (animations)
- react-native-svg (charts), @expo/vector-icons/Ionicons
- Supabase (cloud exercises + auth), React Query (server state)
- react-hook-form + zod (forms)

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
- [v3.0] AI Smart Trainer — Google Gemini integration (Pro only):
  - Created services/ai/types.ts: AIUserProfile, AIBuildContext, AIGeneratedRoutine, AIExerciseFill, AISmartWeeklyPlan, AIServiceError, AIWeekDay, AIProgressAnalysis types.
  - Created services/ai/prompts.ts: buildRoutinePrompt, buildExerciseFillPrompt, buildWeeklyPlanPrompt — persona "Coach Alex, 20+ yrs".
  - Created services/ai/aiService.ts: callGemini<T> (JSON mode, retry×2, markdown-fence strip), mapHttpError, generateRoutine, generateExerciseFill, generateSmartWeeklyPlan, validateGeminiKey.
  - Created services/ai/aiUtils.ts: buildAIContext (store → AIBuildContext), inferFocusMuscles, isAIProfileComplete, DEFAULT_AI_PROFILE.
  - Created components/ai/AIGeneratorModal.tsx: Feature 1 multi-step modal (gate→key→profile→confirm→generating→preview→error). PulsingRing Reanimated animation. Inline exercise editor in preview.
  - Created components/ai/AIExerciseFillButton.tsx: Feature 2 drop-in button. FillPreviewModal with numbered steps, tips, mistakes, breathing card, variation chips.
  - Extended store/index.ts (v6): geminiApiKey + aiProfile added to AppSettings; aiWeeklyPlanCache (runtime-only, not persisted) + setAIWeeklyPlanCache / clearAIWeeklyPlanCache actions.
  - Model: gemini-2.0-flash with responseMimeType "application/json".
  - Pro gate on every AI entry point via settings.isPremium check.
- [v2.1] Cloud Backend (Supabase) Integration:
  - Synced Cloud Exercises into CustomExerciseManager (routine picker): cloud+local merged, de-duplicated by id.
  - Added isCloud flag to CustomExercise type and cloudExerciseToCustom mapper.
  - Created lib/supabase.ts (Supabase client with AsyncStorage session persistence).
  - Created lib/supabaseTypes.ts (DB row types, CloudExercise unified type, AuthUser).
  - Created lib/exerciseMapper.ts (DB row ↔ app type converters).
  - Created lib/exerciseService.ts (React Query hooks: useMyCustomExercises, useCreateExercise, useUpdateExercise, useArchiveExercise + syncLocalCustomExercisesToSupabase migration helper).
  - Created lib/mediaUploadService.ts (image/GIF/video upload to Supabase Storage with validation).
  - Created app/auth/_layout.tsx, app/auth/login.tsx, app/auth/register.tsx (Email, Google, Apple Sign In + Guest mode).
  - Created app/exercise/create.tsx (cloud save when authed, local fallback when guest).
  - Created app/exercise/[id].tsx (view/edit/archive cloud exercise).
  - Created components/exercise/ExerciseForm.tsx (controlled form with react-hook-form).
  - Created components/exercise/ExerciseMediaPicker.tsx + ExerciseMediaPreview.tsx.
  - Extended store/index.ts (v5) with authUser, syncStatus, localSyncDone + auth actions.
  - Updated app/_layout.tsx with QueryClientProvider + Supabase auth state listener.
  - Added Account section to More tab (sign in/out, cloud exercises).
  - Installed expo-auth-session, expo-crypto.
- [v2.6] UI/UX Refinements & Quality of Life:
  - Added ability to set custom Rest Time per exercise during active workouts.
  - Improved Measures Line Chart to scale proportionally from left to right for small datasets.
  - Added smooth slide-to-reveal animations for deleting Measure Logs.
  - Fixed Routine Builder UI distortions (Filter Pills, duplicate + signs, Safe Area on Modals).
- [v2.5] Implemented 1RM Tracking:
  - Created lib/1rm.ts for Epley, Brzycki, Lombardi calculations.
  - Upgraded store/index.ts (v4) with exercisePRs and automated PR tracking on finish.
  - Added real-time 1RM card with Reanimated PR badge in app/workout/active.tsx.
  - Created components/ui/LineChart.tsx (SVG) for strength progression.
  - Added Strength Progress tab in app/history.tsx and detail view in ExerciseDetailModal.tsx.
  - Added 1RM formula settings in app/more.tsx.
- [v2.0.0] Initial publishing with 1RM Calculator and UI refinements.
- [v2.5.1] Bug Fixes:
  - Fixed TypeScript 'never' type narrowing issue in store/index.ts for 1RM PR processing.
  - Resolved Android IDE 'ResourceException' by triggering workspace refresh.
  - Fixed 'shared-testutil.jar' build path error in node_modules by creating dummy artifact.
```
