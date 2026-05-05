# SmartGym 💪

A **premium, production-ready fitness tracking app** built with Expo SDK 55 + React Native 0.76.5.

## ✨ Features

- **Full Routine Builder** — Create workouts with exercises, sets, reps, weight, rest timers
- **1RM Calculator** — Integrated calculator for One-Rep Max with safety percentages (v2.0.0)
- **v1.5 Premium Exercise Library** — 35+ high-quality exercises with high-resolution images
- **Advanced Search & Filter** — Deep filtering by muscle, difficulty, and equipment
- **Custom Exercise System** — Create and manage your own custom exercises
- **Live Workout Session** — Set-by-set logging with custom per-exercise rest timers and animated progress
- **Guided Onboarding Tour** — 7-step spotlight tour on first launch
- **Explore Tab** — Featured programs, quick workouts, and browse by muscle group
- **History & Analytics** — Weekly heatmap, volume charts, and monthly summary
- **Body Measurements** — Track body measurements with smooth trend charts and interactive logs
- **Premium Design** — Dark mode, neon green accent (#00FF9D), and Dynamic Island support
- **Store Persistence** — All your data is saved locally using Zustand + AsyncStorage

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
| Framework | Expo SDK 55 + expo-router v4 |
| Language | TypeScript (strict) |
| Styling | StyleSheet (dark theme system via `lib/theme.ts`) |
| State | Zustand 5 + Immer 10 |
| Navigation | expo-router (file-based, bottom tabs) |
| Icons | @expo/vector-icons (Ionicons) |
| Charts | react-native-svg |
| Storage | @react-native-async-storage/async-storage |
| Animations | react-native-reanimated + gesture-handler |

## 📁 Project Structure

```
SmartGym/
├── app/
│   ├── _layout.tsx          # Root layout + first-launch tour trigger
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tab navigator (5 tabs)
│   │   ├── index.tsx        # Routines tab
│   │   ├── explore.tsx      # Explore tab
│   │   ├── history.tsx      # History & analytics
│   │   ├── measures.tsx     # Body measurements
│   │   └── more.tsx         # Settings & more
│   ├── routine/
│   │   ├── create.tsx       # Create new routine (modal)
│   │   └── [id].tsx         # Edit existing routine
│   └── workout/
│       ├── active.tsx       # Live workout session (full-screen modal)
│       └── all-exercises.tsx # Premium Exercise Library (v1.5)
├── components/
│   ├── exercise/
│   │   ├── ExerciseImage.tsx # Shimmering image loader (v1.5)
│   │   └── ExerciseDetailModal.tsx # Exercise detail view (v1.5)
│   ├── tour/
│   │   └── GuidedTour.tsx   # 7-step spotlight onboarding
│   └── ui/
│       ├── Text.tsx         # Typography system
│       ├── Card.tsx         # Card with glow variants
│       ├── Button.tsx       # Button (6 variants, 3 sizes)
│       ├── ProgressRing.tsx # SVG circular progress
│       ├── Badge.tsx        # Pill badges
│       └── EmptyState.tsx   # Empty state with icon
├── lib/
│   ├── theme.ts             # Design tokens (colors, spacing, radii)
│   └── exercises.ts         # 35+ exercise library with metadata
└── store/
    └── index.ts             # Zustand store (routines, workouts, history, measures)
```

## 🎨 Design System

```ts
// Key colors from lib/theme.ts
Colors.accent          = '#00FF9D'   // Neon green — primary CTA
Colors.background.primary = '#0A0A0F' // Deep dark background
Colors.background.card    = '#13131A' // Card surface
Colors.text.primary       = '#FFFFFF'
Colors.text.secondary     = '#A0A0B8'
```

## 📱 Screens Overview

### Routines Tab
- Empty state with guided tour prompt
- Searchable routine list with color-coded cards
- Long-press: Edit / Duplicate / Delete
- FAB (+) to create a new routine

### Explore Tab
- AI Smart Trainer teaser (PRO feature)
- Featured programs (7-Minute Workout, HIIT, Full Body, Strength)
- Quick workouts grid
- Browse by muscle group

### History Tab
- Week/Month/Year selector
- ProgressRing with workout count vs target
- SVG volume bar chart (7-day)
- Sessions log, monthly stats, awards grid

### Measures Tab
- Add body measurements (9 fields)
- Weight trend mini line chart
- Per-metric change delta display

### More Tab
- Premium upgrade card
- Workout, app, and notification settings
- Restart guided tour
- Export/delete data options

## 🏋️ Workout Flow

1. **Routines tab** → tap **Start** on a routine
2. **Active Workout** screen opens full-screen
3. Log each set (weight + reps), tap ✓ to mark complete
4. **Rest Timer** auto-starts after each set completion
5. Tap **Finish** → confirmation → saves to history

## 📦 EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for both platforms
eas build --platform all
```

## 🔮 Roadmap (Not Yet Implemented)

- [ ] expo-sqlite + drizzle-orm persistence (currently in-memory Zustand)
- [ ] Real Gemini AI integration for Smart Trainer
- [ ] Push notifications for rest timer
- [ ] iCloud / Google Drive backup
- [ ] Apple Health / Google Fit sync
- [ ] In-app purchases (RevenueCat) for Premium

## 📄 License

MIT — built as an open-source Expo starter.
