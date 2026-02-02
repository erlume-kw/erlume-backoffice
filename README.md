# Erlume Backoffice

Admin dashboard for managing the Erlume marketplace.

## Quick start

```sh
npm i
npm run dev
```

## Environment

The app uses REST endpoints configured via `VITE_API_BASE_URL` (defaults to `/api`).

Example:

```
VITE_API_BASE_URL=https://your-api-host.com/api
```

### OpenAPI spec (recommended: use backend URL)

The backend serves filtered specs. The backoffice should load the spec from:

| Audience   | URL |
| ---------- | --- |
| Backoffice | `<backend-base>/api-docs/backoffice.json` |
| Frontend   | `<backend-base>/api-docs/frontend.json` |
| Full API   | `<backend-base>/api-docs.json` |

- **Recommended:** Set `VITE_OPENAPI_SPEC_URL` to your backoffice spec (e.g. `http://localhost:3000/api-docs/backoffice.json` in dev, `https://api.yourapp.com/api-docs/backoffice.json` in production). If unset, the app derives it from `VITE_API_BASE_URL` (e.g. `http://localhost:3000/api` → `http://localhost:3000/api-docs/backoffice.json`).
- **Swagger UI / OpenAPI tools:** Set the spec URL to that value.
- **Code generation:** Point the generator at that URL or download the JSON from it.
- **Offline/static:** You can copy the backend’s `GET /api-docs/backoffice.json` into the repo as e.g. `openapi.json` and point tools at the file; the repo’s `openapi.json` is optional.

## API endpoints

Users

- GET `/api/users`
- GET `/api/users/:id`
- POST `/api/users`
- PUT `/api/users/:id`
- DELETE `/api/users/:id`
- PUT `/api/users/:id/seller` (seller info update)

Sellers

- PUT `/api/sellers/:id`
- PATCH `/api/sellers/:id`

Items

- GET `/api/items`
- GET `/api/items/:id`
- POST `/api/items`
- PUT `/api/items/:id`
- DELETE `/api/items/:id`

Categories

- GET `/api/categories`
- GET `/api/categories/:id`
- POST `/api/categories`
- PUT `/api/categories/:id`
- DELETE `/api/categories/:id`

SubCategories

- GET `/api/subcategories`
- GET `/api/subcategories/:id`
- POST `/api/subcategories`
- PUT `/api/subcategories/:id`
- DELETE `/api/subcategories/:id`

Orders

- GET `/api/orders`
- GET `/api/orders/:id`
- POST `/api/orders`
- PATCH `/api/orders/:id/status`
- DELETE `/api/orders/:id`

OrderItems

- GET `/api/orderitems`
- GET `/api/orderitems/:id`
- POST `/api/orderitems`
- PUT `/api/orderitems/:id`
- DELETE `/api/orderitems/:id`

Transactions

- GET `/api/transactions`
- GET `/api/transactions/:id`
- POST `/api/transactions`
- PUT `/api/transactions/:id`
- DELETE `/api/transactions/:id`

Credit Cards

- GET `/api/creditcards`
- GET `/api/creditcards/:id`
- POST `/api/creditcards`
- PUT `/api/creditcards/:id`
- DELETE `/api/creditcards/:id`

Reviews

- GET `/api/reviews`
- GET `/api/reviews/:id`
- POST `/api/reviews`
- PUT `/api/reviews/:id`
- DELETE `/api/reviews/:id`

Drops

- GET `/api/drops`
- GET `/api/drops/:id`
- POST `/api/drops`
- PUT `/api/drops/:id`
- DELETE `/api/drops/:id`
- GET `/api/drops/:id/items`
- POST `/api/drops/:id/items`
- DELETE `/api/drops/:id/items/:itemId`

Demands

- GET `/api/demands`
- GET `/api/demands/:id`
- POST `/api/demands`
- PUT `/api/demands/:id`
- DELETE `/api/demands/:id`

Discount Codes

- GET `/api/discountcodes`
- GET `/api/discountcodes/:id`
- POST `/api/discountcodes`
- PUT `/api/discountcodes/:id`
- DELETE `/api/discountcodes/:id`

Outfits

- GET `/api/outfits`
- GET `/api/outfits/:id`
- POST `/api/outfits`
- PUT `/api/outfits/:id`
- DELETE `/api/outfits/:id`

OutfitItems

- GET `/api/outfititems`
- GET `/api/outfititems/:id`
- POST `/api/outfititems`
- PUT `/api/outfititems/:id`
- DELETE `/api/outfititems/:id`

Enums

- GET `/api/enums`
- GET `/api/enums/:category`
