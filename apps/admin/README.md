# SmartGym Admin Dashboard Web Panel 🛠️

A standalone, premium administration web portal for the **SmartGym** fitness app. It allows administrators to manage the global exercise catalog, define routine templates, and analyze application stats.

## 🚀 Features

- **Secure Auth & Role Access** — Integrated with Supabase Auth. Restricts write operations using strict PostgreSQL Row Level Security (RLS) policies allowing access only to admin profiles.
- **Exercise Catalog Management** — Full CRUD management for global exercises. Supports CSV and JSON import/export for batch catalog updates.
- **Drag-and-Drop Routine Builder** — Advanced interactive builder supporting both Flat Workouts and Multi-Day Programs. Configure dynamic parameters including:
  - Tempo (e.g., 3-1-1-0)
  - Target RPE (Rate of Perceived Exertion)
  - Rest timers
  - Dynamic Sets and Reps
- **Clean Architecture** — Configured with React 19, TypeScript, and Vite 8 with HMR. Uses Oxlint for fast, modern code linting.

## 🏗 Tech Stack

- **Core**: React 19, TypeScript, Vite 8
- **Routing**: React Router DOM v7
- **Database / Auth**: Supabase JS Client (`@supabase/supabase-js`)
- **Icons**: Lucide React
- **Linter**: Oxlint

## 🛠 Setup and Development

Make sure you have configured your environment variables first. Create a `.env` or `.env.local` file in this directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Lint the codebase
npm run lint

# Preview production build locally
npm run preview
```

## 📁 Database Schema Integration
Database policies and schemas for the admin dashboard are maintained in `SmartGym/supabase/migrations/`:
- `006_admin_dashboard.sql` — RLS rules, admin write policies.
- `007_profiles_is_admin.sql` — User profile admin flag schema.
