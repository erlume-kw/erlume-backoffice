# API & Field Audience Documentation

This doc clarifies **who uses what** so backoffice and frontend teams avoid confusion: which endpoints and fields are for the **admin dashboard**, which for the **customer-facing website**, and which are **shared**.

- **openapi.json** – API paths and `x-usedBy` (backoffice / frontend / both).
- **models.json** – Canonical field reference for all models (matches backend/Mongoose). Use it for field-level audience and when adding new fields.

---

## OpenAPI spec URL (use backend – recommended)

The backend serves the spec. The backoffice should load it from the backend instead of a static file:

| What | URL |
| ---- | --- |
| **Backoffice-only (filtered)** | `http://localhost:3000/api-docs/backoffice.json` |
| Frontend-only (filtered) | `http://localhost:3000/api-docs/frontend.json` |
| Full API | `http://localhost:3000/api-docs.json` |

- **Backoffice:** Use `<your-backend-base>/api-docs/backoffice.json` (e.g. in production: `https://api.yourapp.com/api-docs/backoffice.json`).
- **Swagger UI / OpenAPI tools:** Set the spec URL to that.
- **Code generation:** Point the generator at that URL or download the JSON from it.
- **Optional static file:** No need to copy `openapi.json` into the backoffice repo unless you want to work offline; if so, run the backend once and save `GET /api-docs/backoffice.json` as e.g. `backoffice-openapi.json`.

The backoffice’s `api-config` exports `OPENAPI_SPEC_URL` (from `VITE_OPENAPI_SPEC_URL` or derived from `VITE_API_BASE_URL`) for use in Swagger UI or tooling.

---

## Convention

| Value          | Meaning                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **backoffice** | Admin dashboard (erlume-backoffice) only. Full CRUD, internal data, seller/user management. Do not expose these endpoints or sensitive fields to the customer site.                    |
| **frontend**   | Customer-facing website only. Catalog, checkout, my orders, reviews, discount validation.                                                                                              |
| **both**       | Used by both backoffice and frontend. Catalog, orders, shared lookups. When adding fields, mark in this doc if a field is backoffice-only so the frontend does not display or send it. |

- **openapi.json**: Every path has `x-usedBy` (array of `backoffice` | `frontend`). See root `x-audience-convention` in the spec.
- **Field-level**: Use the tables below (and extend them) so backend/backoffice/frontend agree on which fields are shown or editable where. Comment sensitive or internal-only fields in API schemas when you add them.

**Backend routes:** The backoffice calls the paths listed below. If you see **"Cannot GET /api/..."** (or 404), the backend has not implemented that route yet. Implement the corresponding path from `openapi.json` (e.g. `GET /api/incomes` for the Incomes page).

---

## Endpoint audience (x-usedBy)

Aligned with `openapi.json`. Update this table when adding or changing paths.

| Path                                | Used by    | Notes                                                                                               |
| ----------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `/api/users`                        | backoffice | User management, roles, includeDeleted.                                                             |
| `/api/users/{id}`                   | backoffice | Get/update/delete user.                                                                             |
| `/api/users/{id}/seller`            | backoffice | Update seller info by user id.                                                                      |
| `/api/users/{id}/roles`             | backoffice | Update user roles.                                                                                  |
| `/api/sellers`                      | backoffice | List/create sellers. Query: includeDeactivated.                                                     |
| `/api/sellers/{id}`                 | backoffice | Get/update/delete (soft) seller.                                                                    |
| `/api/items`                        | both       | Catalog + admin list. Query: itemStatus, authenticationStatus, returnStatus, etc.                   |
| `/api/items/{id}`                   | both       | Product page + admin detail.                                                                        |
| `/api/categories`                   | both       | Nav + admin.                                                                                        |
| `/api/categories/{id}`              | both       |                                                                                                     |
| `/api/subcategories`                | both       |                                                                                                     |
| `/api/subcategories/{id}`           | both       |                                                                                                     |
| `/api/orders`                       | both       | Admin list + customer "my orders" (scope by user).                                                  |
| `/api/orders/user/{userId}`         | both       | Orders for a user.                                                                                  |
| `/api/orders/{id}`                  | both       | Order detail. PATCH: order_status, deliveryDate, deliveryStatus, trackingReference.                 |
| `/api/orders/{id}/status`           | backoffice | Admin updates status.                                                                               |
| `/api/orderitems`                   | backoffice | Admin manages line items.                                                                           |
| `/api/orderitems/{id}`              | backoffice |                                                                                                     |
| `/api/transactions`                 | backoffice | Payments, internal.                                                                                 |
| `/api/transactions/order/{orderId}` | backoffice |                                                                                                     |
| `/api/transactions/{id}`            | backoffice |                                                                                                     |
| `/api/expenses`                     | backoffice |                                                                                                     |
| `/api/expenses/{id}`                | backoffice |                                                                                                     |
| `/api/incomes`                      | backoffice | amount, erlumeCommissionAmount, sellerPayoutAmount; filter by orderId, itemId, sellerId.            |
| `/api/incomes/{id}`                 | backoffice | GET/PUT/PATCH (commission, payout, links).                                                          |
| `/api/creditcards`                  | backoffice | Admin list.                                                                                         |
| `/api/creditcards/user/{userId}`    | both       | Admin views by user; customer sees own.                                                             |
| `/api/creditcards/{id}`             | both       |                                                                                                     |
| `/api/reviews`                      | both       | Admin list; customer may submit/list.                                                               |
| `/api/reviews/{id}`                 | both       |                                                                                                     |
| `/api/drops`                        | both       | Catalog + admin.                                                                                    |
| `/api/drops/{id}`                   | both       |                                                                                                     |
| `/api/drops/{id}/items`             | both       | Items in drop.                                                                                      |
| `/api/drops/{id}/items/{itemId}`    | backoffice | Remove item from drop.                                                                              |
| `/api/demands`                      | backoffice | Demand rates, internal.                                                                             |
| `/api/demands/{id}`                 | backoffice |                                                                                                     |
| `/api/discountcodes`                | backoffice | Admin CRUD.                                                                                         |
| `/api/discountcodes/{id}`           | backoffice |                                                                                                     |
| `/api/discountcodes/code/{code}`    | both       | Lookup by code.                                                                                     |
| `/api/discountcodes/validate`       | frontend   | Checkout validation.                                                                                |
| `/api/outfits`                      | both       | Curations.                                                                                          |
| `/api/outfits/{id}`                 | both       |                                                                                                     |
| `/api/outfititems`                  | backoffice | Admin manages outfit items.                                                                         |
| `/api/outfititems/{id}`             | backoffice |                                                                                                     |
| `/api/sales`                        | backoffice | Sales records, invoice evidence.                                                                    |
| `/api/sales/{id}`                   | backoffice |                                                                                                     |
| `/api/sales/order/{orderId}`        | backoffice |                                                                                                     |
| `/api/enums`                        | both       | Dropdowns, filters (backoffice + frontend).                                                         |
| `/api/enums/{category}`             | both       | orderStatus, itemStatus, authenticationStatus, returnStatus, deliveryStatus, escalationStatus, etc. |

---

## Field-level audience (main models)

Use **backoffice** / **frontend** / **both** in the same way. Extend this table when adding or changing fields. Backend: prefer documenting sensitive or internal-only fields in API schema descriptions (e.g. "Backoffice only – do not expose to frontend.").

### User

| Field                                                                 | Used by    | Notes                                                 |
| --------------------------------------------------------------------- | ---------- | ----------------------------------------------------- |
| \_id, emailAddress, phoneNumber, address, roles, createdAt, updatedAt | backoffice | Admin management.                                     |
| username                                                              | both       | May be shown on frontend (e.g. profile).              |
| password                                                              | backoffice | Never expose or return to frontend.                   |
| cardIds                                                               | both       | Backoffice links; frontend may list customer's cards. |
| isDeleted                                                             | backoffice | Soft-delete; includeDeleted filter.                   |

### Seller

| Field                                                                                                                | Used by    | Notes                                              |
| -------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| \_id, userId, balance, itemIds, IBAN, qrCode, isDeactivated, consentGiven, preferredPickupDate, createdAt, updatedAt | backoffice | Internal; do not expose to customer site.          |
| fullName, emailAddress, phoneNumber, addressText, intakeTimestamp                                                    | backoffice | May live on User in your backend; see models.json. |
| sellerPolicyAcceptedAt, escalationStatus, escalationNotes                                                            | backoffice | Escalation / policy; do not expose to frontend.    |

### Item

| Field                                                                                                                                             | Used by    | Notes                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| \_id, itemName, brandName, imageUrls, basePrice, condition, color, size, quantity, category_id, sub_category_id, itemStatus, createdAt, updatedAt | both       | Catalog + admin; frontend may hide draft/internal statuses. |
| saleRate, listingPrice, drop_id, seller_id                                                                                                        | backoffice | Pricing/ops; optional to hide from public listing.          |
| receiptPhotoUrls, priceEstimatorUrls, quoteUrls, approved, approvedNextDrop, authNeeded, cleaningNeeded, photographed                             | backoffice | Internal workflow; do not expose to frontend.               |
| authenticationStatus, authenticatedAt, returnDate, returnStatus                                                                                   | backoffice | Pickup/return flow; do not expose to frontend.              |
| orderId                                                                                                                                           | backoffice | After sale.                                                 |

### Order

| Field                                                            | Used by | Notes                                                  |
| ---------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| \_id, user_id, orderitem_ids, order_status, createdAt, updatedAt | both    | Frontend: customer's own orders only; backoffice: all. |
| deliveryDate, deliveryStatus, trackingReference                  | both    | Backoffice updates; frontend may display to customer.  |

### Transaction

| Field | Used by    | Notes               |
| ----- | ---------- | ------------------- |
| All   | backoffice | Payments; internal. |

### Income

| Field                                                                                  | Used by    | Notes                                                       |
| -------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| amount, erlumeCommissionAmount, sellerPayoutAmount, order_id, item_id, seller_id, etc. | backoffice | Commission breakdown and payout; internal. See models.json. |

### Review

| Field                                       | Used by | Notes                                                  |
| ------------------------------------------- | ------- | ------------------------------------------------------ |
| \_id, userId, sellerId, rating, description | both    | Frontend: display and submit; backoffice: list/manage. |

### Category / SubCategory / Drop

| Field                              | Used by    | Notes       |
| ---------------------------------- | ---------- | ----------- |
| Public catalog fields (name, etc.) | both       |             |
| Rates, internal ids                | backoffice | Admin only. |

### DiscountCode

| Field                                             | Used by    | Notes                                                       |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------- |
| code, discount_percentage, expiry_date, is_active | backoffice | Admin CRUD.                                                 |
| Frontend                                          | frontend   | Only validate (e.g. POST validate); do not list full codes. |

---

## How to keep this updated

1. **New endpoint**: Add path to openapi.json with `x-usedBy`, and add a row to the "Endpoint audience" table above.
2. **New field**: Add to models.json (canonical reference), add a row to the relevant model in "Field-level audience" below, and if the field is backoffice-only, say so in the API schema description.
3. **Backend**: In request/response schema descriptions, add one line when it matters, e.g. "Backoffice only." or "Exposed to frontend for catalog."
4. **Comments in code**: In backoffice/frontend, a short comment like "Backoffice-only field" next to sensitive usage helps.

This keeps a single place (openapi.json + models.json + this doc) to avoid confusion between backoffice, frontend, and shared usage.
