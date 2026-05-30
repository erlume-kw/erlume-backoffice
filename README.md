# Erlume Backoffice

React + TypeScript admin dashboard for managing the Erlume marketplace.

---

## Setup

```sh
npm install
```

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

```sh
npm run dev
```

Dashboard is available at `http://localhost:8080`.

> The backend must be running at the URL set in `VITE_API_BASE_URL`. See the backend README to get it started.

---

## Logging in

Go to `http://localhost:8080` — you will be redirected to the login page automatically.

Use an account with the `admin` role. If no admin exists yet, create one using the script in the backend README.

After login the session is stored in `localStorage` and persists across page refreshes. Use the **Sign out** button at the bottom of the sidebar to log out.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Base URL of the Erlume backend API |
| `VITE_OPENAPI_SPEC_URL` | Derived from `VITE_API_BASE_URL` | Override the OpenAPI spec URL for Swagger tooling |

---

## Swagger / API docs

The backend serves filtered OpenAPI specs. Point your Swagger tools at:

| Audience | URL |
|----------|-----|
| Backoffice | `http://localhost:3000/api-docs/backoffice.json` |
| Frontend | `http://localhost:3000/api-docs/frontend.json` |
| Full | `http://localhost:3000/api-docs.json` |

---

## Project structure

```
src/
├── pages/          # One file per page (UsersPage, OrdersPage, etc.)
├── components/
│   ├── layout/     # AdminLayout, AdminSidebar
│   ├── common/     # DataTable, FilterBar, StatusBadge
│   └── ui/         # Shadcn/ui primitives
├── context/
│   └── AuthContext.tsx   # Login / logout / token state
├── lib/
│   ├── auth.ts           # localStorage token helpers
│   ├── rest-client.ts    # All API calls (auto-injects Bearer token)
│   └── api-config.ts     # Endpoint definitions
└── types/
    └── models.ts         # TypeScript interfaces for all models
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest tests |
