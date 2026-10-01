# AGENTS.md

Stock management web application built with React 19, Vite, and Supabase.

## Commands

- `npm run dev` : Start local development server.
- `npm run build` : Build for production (`dist/`).
- `npm run lint` : Run Oxlint (`.oxlintrc.json`). Note: uses `oxlint`, not ESLint.
- `npm run preview` : Preview production build locally.
- *Testing*: No test runner is currently configured.

## Environment & Prerequisites

Requires `.env.local` containing:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
Client initialized in `src/supabaseClient.js`.

## Architecture & Data Flow

- **Auth Pattern (`src/Auth.jsx`)**: Supabase Auth requires an email, but the UI presents a username field. Usernames are mapped internally to `${cleanUsername}.user@gmail.com` with `username` stored in `user_metadata`.
- **Database Schema**: Targets the `products` table in Supabase:
  - Columns: `id` (primary key), `name` (text), `category` (text), `quantity` (number), `price` (number), `user_id` (uuid).
  - Protected by Supabase Row-Level Security (RLS) linked to `auth.uid()`.
- **State Management**:
  - Global app state (session, products array, active edit state, currency) lives in `src/App.jsx`.
  - Currency selection (`€`, `$`, `FCFA`) is persisted in `localStorage` under `app_currency`.
  - Optimistic UI updates are used in `App.jsx` for product additions, edits, and deletions before or during Supabase sync.
- **Components & Exports (`src/components/ProductList.jsx`)**:
  - Handles search filtering, category filtering, and real-time dashboard metrics (stock totals, low stock alerts `< 5`).
  - Client-side export: CSV via `data:text/csv` URI and PDF via `jspdf` + `jspdf-autotable`.
- **Styling**: Pure CSS in `src/App.css` (dark glassmorphism theme, no Tailwind or CSS-in-JS).
