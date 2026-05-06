# SmartGym Cloud Sync & Health Sync Test Plan

## 1. Offline & Local Data Persistence
- [ ] **Guest Mode Creation**: Launch app without logging in. Create a custom exercise, routine, and log a workout session. Close and restart the app. Verify data persists via `AsyncStorage`.
- [ ] **Offline Auth**: Start with no connection, log in (if session exists), create a routine. Restore connection, ensure it pushes to cloud.

## 2. Cloud Synchronization
- [ ] **Initial Sync (Guest to User)**: 
  - Create guest data.
  - Log in to a Supabase account.
  - Verify guest data is merged and pushed to Supabase (check `routines`, `workout_sessions` tables).
- [ ] **Multi-device Sync**:
  - Log into Device A, create "Leg Day".
  - Log into Device B. Verify "Leg Day" pulls down correctly.
- [ ] **Sync Status UI**:
  - Check `My Custom Exercises` to verify "Local" badge changes to "Synced" after logging in.

## 3. Conflict Resolution & Soft Deletion
- [ ] **Soft Deletion**:
  - Delete a routine locally while online.
  - Verify it is removed from the UI.
  - Verify Supabase `routines` table sets `deleted_at` instead of hard deleting the row.
- [ ] **Conflict Update**:
  - Edit the same routine on two devices while offline. Go online. The last `updated_at` should win.

## 4. Health Sync Integration
- [ ] **Expo Go Degradation**:
  - Open app in Expo Go. Go to More -> Health Sync. 
  - Verify it says "Health Sync is not available on this device" (because Expo Go lacks native modules).
- [ ] **Native Build (Apple Health)**:
  - Run on iOS Simulator/Device using `npx expo run:ios`.
  - Go to Health Sync -> Connect. Verify Apple Health permission modal appears.
  - Finish a workout. Open Apple Health app and verify the workout duration and calories (volume) appear.
- [ ] **Native Build (Health Connect)**:
  - Run on Android Emulator/Device using `npx expo run:android`.
  - Go to Health Sync -> Connect. Verify Google Health Connect permission modal appears.
  - Log body weight. Verify the weight entry appears in Health Connect.

## 5. Logout & Privacy
- [ ] **Secure Logout**:
  - Log out of the account.
  - Verify the local app state resets to an empty guest state (routines and sessions disappear).
  - Log back in, verify data restores from cloud.
