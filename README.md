# Erlume Backoffice

React + TypeScript admin dashboard for managing the Erlume luxury resale marketplace.

---

## Prerequisites

- **Node.js** v18 or higher
- The **Erlume backend** running (see backend README)

---

## 1. Install dependencies

```sh
npm install
```

---

## 2. Create `.env`

Create a `.env` file in the root of the project:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

> Change the URL if your backend runs on a different host or port.

---

## 3. Run the dashboard

```sh
npm run dev
```

Dashboard is available at `http://localhost:8080`.

---

## 4. Log in

Go to `http://localhost:8080` — you will be redirected to the login page automatically.

Use an account with the `admin` role. If no admin exists yet, create one using the script in the backend README.

**Session:** stored in `localStorage`, persists across page refreshes. Use the **Sign out** button at the bottom of the sidebar to log out. Tokens auto-refresh in the background — you stay logged in for 30 days without re-entering your password.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Base URL of the Erlume backend API |
| `VITE_OPENAPI_SPEC_URL` | Derived from `VITE_API_BASE_URL` | Override the OpenAPI spec URL |

---

## Pages

| Page | What it does |
|------|-------------|
| **Dashboard** | KPI overview |
| **Items** | Full CRUD · image upload · bulk updates · seller & drop assignment |
| **Orders** | Create (registered user or guest) · update status · track delivery |
| **Sellers** | Profiles · balance · payout tracking with history |
| **Users** | Accounts · role management |
| **Drops** | Collections with banner images |
| **Outfits** | Curated looks linking multiple items |
| **Discount Codes** | Create & manage promo codes |
| **Categories / Subcategories** | Taxonomy management |
| **Transactions / Sales / Incomes** | Financial records |
| **Expenses / Employees** | Operations management |
| **Shipping** | Shipping zones and rates |
| **Newsletter** | Subscriber management |
| **Reviews** | Moderate buyer reviews |

---

## Project structure

```
src/
├── pages/          # One file per page (UsersPage, OrdersPage, etc.)
├── components/
│   ├── layout/     # AdminLayout, AdminSidebar
│   ├── common/     # DataTable, FilterBar, StatusBadge, ImageUploader
│   └── ui/         # Shadcn/ui primitives
├── context/
│   └── AuthContext.tsx   # Login / logout / token state
├── lib/
│   ├── auth.ts           # localStorage token helpers
│   ├── rest-client.ts    # All API calls (auto-injects Bearer, auto-refreshes on 401)
│   └── api-config.ts     # Endpoint definitions
├── hooks/
│   └── use-resource-list.ts  # Generic data fetching hook
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
