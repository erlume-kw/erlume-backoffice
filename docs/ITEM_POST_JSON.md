# Item POST / PUT JSON (backoffice)

The backoffice sends this JSON for **POST /api/items** (create) and **PUT /api/items/{id}** (update).  
Undefined fields are omitted before sending.

**Canonical schema:** Use only the field names below. `brandName` is the only brand field — do not use `brand`.

## Request body (canonical field names)

| Field                  | Type     | Required (create) | Notes                                            |
| ---------------------- | -------- | ----------------- | ------------------------------------------------ |
| `itemName`             | string   | ✓                 |                                                  |
| `brandName`            | string   | ✓                 | Only brand field; do not use `brand`             |
| `basePrice`            | string   | ✓                 |                                                  |
| `condition`            | string   | ✓                 | enum                                             |
| `uploadedAt`           | string   | ✓                 | ISO 8601 date-time                               |
| `saleRate`             | string   | ✓                 |                                                  |
| `itemStatus`           | string   | ✓                 | enum                                             |
| `color`                | string   | ✓                 |                                                  |
| `size`                 | string   | ✓                 |                                                  |
| `quantity`             | string   | ✓                 |                                                  |
| `category_id`          | string   | ✓                 | OBJECT_ID ref Category                           |
| `listingPrice`         | string   | ✓                 |                                                  |
| `imageUrls`            | string[] | ✓                 | At least one URL                                 |
| `itemModel`            | string   |                   |                                                  |
| `year`                 | string   |                   |                                                  |
| `sub_category_id`      | string   |                   | OBJECT_ID ref SubCategory                        |
| `drop_id`              | string   |                   | OBJECT_ID ref Drop                               |
| `seller_id`            | string   |                   | OBJECT_ID ref User                               |
| `receiptPhotoUrls`     | string[] |                   |                                                  |
| `priceEstimatorUrls`   | string[] |                   |                                                  |
| `quoteUrls`            | string[] |                   |                                                  |
| `approved`             | boolean  |                   |                                                  |
| `approvedNextDrop`     | boolean  |                   |                                                  |
| `orderId`              | string   |                   | OBJECT_ID ref Order (optional)                   |
| `authNeeded`           | boolean  |                   |                                                  |
| `cleaningNeeded`       | boolean  |                   |                                                  |
| `photographed`         | boolean  |                   |                                                  |
| `authenticationStatus` | string   |                   | enum: pending, authentic, not_authentic          |
| `authenticatedAt`      | string   |                   | ISO 8601 date-time                               |
| `returnDate`           | string   |                   | ISO date (YYYY-MM-DD)                            |
| `returnStatus`         | string   |                   | enum: pending, scheduled, returned, not_returned |

## Canonical Item object (response / type)

```json
{
	"_id": "OBJECT_ID",
	"basePrice": "string",
	"condition": "string (enum)",
	"uploadedAt": "date",
	"saleRate": "string",
	"itemStatus": "string (enum)",
	"color": "string",
	"size": "string",
	"itemName": "string",
	"itemModel": "string",
	"year": "string",
	"quantity": "string",
	"brandName": "string (only brand field; do not use brand)",
	"imageUrls": ["string"],
	"receiptPhotoUrls": ["string"],
	"priceEstimatorUrls": ["string"],
	"quoteUrls": ["string"],
	"approved": "boolean",
	"approvedNextDrop": "boolean",
	"orderId": "OBJECT_ID (optional, ref Order)",
	"authNeeded": "boolean",
	"cleaningNeeded": "boolean",
	"listingPrice": "string (required)",
	"photographed": "boolean",
	"authenticationStatus": "string (optional, enum)",
	"authenticatedAt": "date (optional)",
	"returnDate": "date (optional)",
	"returnStatus": "string (optional, enum)",
	"seller_id": "OBJECT_ID (optional, ref User)",
	"category_id": "OBJECT_ID (ref Category)",
	"sub_category_id": "OBJECT_ID (optional, ref SubCategory)",
	"drop_id": "OBJECT_ID (optional, ref Drop)",
	"createdAt": "date",
	"updatedAt": "date"
}
```

## Example (minimal create)

```json
{
	"itemName": "Classic Jacket",
	"brandName": "BrandX",
	"condition": "gently_used",
	"basePrice": "90",
	"saleRate": "20",
	"size": "M",
	"color": "Black",
	"quantity": "1",
	"itemStatus": "available",
	"category_id": "CAT_ID",
	"listingPrice": "90",
	"imageUrls": ["https://example.com/image.jpg"],
	"uploadedAt": "2026-01-30T12:00:00.000Z"
}
```

## Source

- **Create:** `restApi.items.create(payload)` → `POST /api/items`
- **Update:** `restApi.items.update(id, payload)` → `PUT /api/items/{id}`
- Payload built in `src/pages/ItemsPage.tsx` in `handleSubmit`.
- Type: `src/types/models.ts` — `Item` interface.
