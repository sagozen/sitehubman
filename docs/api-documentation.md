# SiteHubMan — Complete Backend API Specification

> Give this document to your backend developer.
> It maps **every Firestore operation** in the app to a REST API endpoint.

---

## Overview

The app currently uses **Firebase Firestore directly** from the client.
To connect a proper backend, replace each Firestore call with an API call.

### Base URL
```
https://api.sitehubman.com/v1
```

### Authentication
All endpoints (except Public) require a `Bearer` token in the `Authorization` header.
```
Authorization: Bearer <firebase_id_token>
```

### ID Conventions
| Entity | Format | Example |
|--------|--------|---------|
| Guest ID | `GST_xxxxxxxx` | `GST_a1B2c3D4` |
| Card ID | `BC-NFC_XXXXXXXX` | `BC-NFC_X7K2M9QP` |
| Order Number | `ORD_xxxxxxxx` | `ORD_f4G7h8J2` |
| User ID | Firebase Auth UID | `abc123xyz` |
| Profile Slug | `name-suffix` | `chanthean-a1b2c3` |

---

## 1. Authentication APIs

### `POST /auth/register`
Create a new customer account.
```json
// Request
{
  "email": "chanthean@gmail.com",
  "password": "securePass123",
  "displayName": "Chan Thean",
  "phone": "+855123456789",
  "language": "en"
}

// Response 201
{
  "userId": "firebase_uid_abc",
  "email": "chanthean@gmail.com",
  "displayName": "Chan Thean",
  "role": "customer",
  "token": "<firebase_id_token>",
  "plan": "free",
  "createdAt": "2026-06-29T09:00:00Z"
}
```
**Firestore:** Creates `users/{userId}`

---

### `POST /auth/login`
Sign in with email/password.
```json
// Request
{ "email": "chanthean@gmail.com", "password": "securePass123" }

// Response 200
{
  "userId": "firebase_uid_abc",
  "email": "chanthean@gmail.com",
  "role": "customer",
  "token": "<firebase_id_token>",
  "dashboardRoute": "/customer"
}
```

---

### `POST /auth/login/google`
Sign in with Google OAuth token.
```json
// Request
{ "idToken": "<google_id_token>" }
// Response 200 — same as login
```

---

### `POST /auth/login/telegram`
Sign in with Telegram auth data.
```json
// Request
{ "telegramAuthData": { "id": 123, "first_name": "Chan", "hash": "..." } }
// Response 200 — same as login
```

---

### `POST /auth/guest`
Create an anonymous guest session (Firebase anonymous auth).
```json
// Response 201
{
  "userId": "anon_uid_xyz",
  "role": "guest",
  "isGuest": true,
  "token": "<firebase_id_token>"
}
```

---

### `POST /auth/logout`
Sign out current user. Invalidate token.
```json
// Response 200
{ "success": true }
```

---

### `GET /auth/profile`
Get current user profile.
```json
// Response 200
{
  "id": "firebase_uid_abc",
  "email": "chanthean@gmail.com",
  "displayName": "Chan Thean",
  "role": "customer",
  "phone": "+855123456789",
  "language": "en",
  "plan": "free",
  "isActive": true,
  "createdAt": "2026-06-29T09:00:00Z"
}
```
**Firestore:** Reads `users/{userId}`

---

## 2. Guest Identity APIs

### `POST /guests`
Create a new guest session with generated IDs.
```json
// Response 201
{
  "guestId": "GST_a1B2c3D4",
  "cardId": "BC-NFC_X7K2M9QP",
  "publicSlug": "chanthean-a1b2c3",
  "guestAccessKey": "randomKey28chars...",
  "status": "active"
}
```
**Firestore:** Creates `guests/{guestId}` + `guestSessions/{guestId}`

---

### `GET /guests/:guestId`
Get guest session details.
```json
// Response 200
{
  "guestId": "GST_a1B2c3D4",
  "cardId": "BC-NFC_X7K2M9QP",
  "status": "active",
  "createdAt": "2026-06-29T09:00:00Z"
}
```

---

### `POST /guests/:guestId/convert`
Convert guest to customer. **This is the critical conversion endpoint.**
```json
// Request
{
  "userId": "firebase_uid_abc",
  "cardId": "BC-NFC_X7K2M9QP"
}

// Response 200
{
  "success": true,
  "guestId": "GST_a1B2c3D4",
  "customerId": "firebase_uid_abc",
  "cardsConverted": 1,
  "ordersConverted": 0,
  "errors": []
}
```
**What happens server-side:**
1. All cards with `guestId` -> `ownerType: "customer"`, `ownerId: userId`
2. All orders with `guestId` -> `userId: userId`, `ownerId: userId`
3. Guest doc -> `status: "converted"`, `convertedToUserId: userId`
4. **IDs never change:** `cardId`, `orderId`, `orderNumber`, `publicSlug` preserved

---

## 3. Card APIs

### `POST /cards`
Create a new card draft (guest or customer).
```json
// Request
{
  "guestId": "GST_a1B2c3D4",
  "profile": {
    "fullName": "Chan Thean",
    "role": "Software Engineer",
    "company": "TechCo",
    "phone": "+855123456789",
    "email": "chanthean@gmail.com",
    "telegram": "@chanthean"
  },
  "design": {
    "cardDesign": "classic_black",
    "product": "pvc_card",
    "cardChoice": "physical"
  }
}

// Response 201
{
  "cardId": "BC-NFC_X7K2M9QP",
  "publicSlug": "chanthean-a1b2c3",
  "publicProfileUrl": "https://sitehubman.com/u/chanthean-a1b2c3",
  "status": "draft",
  "ownerType": "guest",
  "ownerId": "GST_a1B2c3D4"
}
```
**Firestore:** Creates `cards/{cardId}`

---

### `GET /cards/:cardId`
Get card details.

---

### `PUT /cards/:cardId`
Update card profile and/or design (only if not design-locked).

---

### `GET /cards?ownerId=:userId`
List all cards owned by a user.

---

### `POST /cards/:cardId/lock`
Lock card design after order is placed.

---

## 4. Order APIs

### `POST /orders`
Create a new order (staff/sales creates).
```json
// Request
{
  "customerName": "Chan Thean",
  "phone": "+855123456789",
  "email": "chanthean@gmail.com",
  "productType": "physical_nfc",
  "quantity": 1,
  "cardDesign": "classic_black",
  "paymentStatus": "pending_payment",
  "paymentMethod": "aba_khqr",
  "amount": 15,
  "currency": "USD",
  "fulfillment": "physical"
}

// Response 201
{
  "orderId": "firestore_auto_id",
  "orderNumber": "ORD_f4G7h8J2",
  "status": "pending_payment",
  "cardId": "BC-XXXX",
  "assignedSalesman": "sales_uid"
}
```

---

### `POST /orders/customer`
Customer self-service order (from guest card design).
```json
// Request
{
  "cardId": "BC-NFC_X7K2M9QP",
  "shippingName": "Chan Thean",
  "phone": "+855123456789",
  "deliveryAddress": "Phnom Penh, Cambodia",
  "quantity": 1,
  "cardType": "pvc_card",
  "paymentMethod": "aba_khqr",
  "currency": "USD"
}

// Response 201
{
  "orderId": "firestore_auto_id",
  "orderNumber": "ORD_f4G7h8J2",
  "status": "pending_payment"
}
```

---

### `GET /orders/:orderId`
Get order details.

### `GET /orders?userId=:userId`
List orders for a user.

### `GET /orders/search?q=:query`
Search orders by orderNumber, cardCode, phone, email.

### `PUT /orders/:orderId`
Update order details (staff only).

### `PUT /orders/:orderId/status`
Advance order status (validates transition rules).

### `POST /orders/:orderId/cancel`
Cancel an order (sales/admin only).

### `POST /orders/:orderId/reorder`
Clone a delivered order as a new pending order.

---

## 5. Payment APIs

### `POST /orders/:orderId/payment/confirm`
Sales confirms payment (QR or cash). **Also approves production.**
```json
// Request
{ "confirmation": "qr_paid" }

// Response 200
{
  "orderId": "...",
  "status": "production_approved",
  "paymentStatus": "paid_qr",
  "salesApprovedAt": "2026-06-29T09:00:00Z"
}
```
**Server-side:** Creates payment record + ledger transaction + approves production.

---

### `POST /orders/:orderId/payment/proof`
Customer uploads payment proof screenshot (multipart/form-data).

### `POST /orders/:orderId/payment/verify`
Admin verifies payment manually.

---

## 6. Production APIs

### `GET /orders/:orderId/production-readiness`
**The production guard.** Check if order can enter production.
```json
// Response 200
{
  "ready": false,
  "checks": {
    "hasCustomerId": true,
    "paymentVerified": false,
    "salesApproved": false
  },
  "blockers": [
    "Payment not verified. Current status: pending_payment.",
    "Sales has not approved this order for production yet."
  ]
}
```

---

### `POST /orders/:orderId/production/approve`
Approve order for production (creates printer job).

### `GET /production/queue`
Get production queue (printer operator view).

### `PUT /production/jobs/:jobId/stage`
Advance printer job stage.
```
received -> printing -> nfc_encoding -> quality_check -> ready_to_ship -> completed
```

### `POST /production/jobs/:jobId/nfc-write`
Record NFC chip write result.
```json
// Request
{
  "chipUID": "04:A1:B2:C3:D4:E5:F6",
  "profileUrl": "https://sitehubman.com/c/BC-NFC_X7K2M9QP",
  "success": true
}
```

### `POST /production/jobs/:jobId/qa`
Submit QA decision (pass/fail).

---

## 7. Sales APIs

### `GET /sales/dashboard`
Sales dashboard stats (orders today, pending payment, etc.).

### `GET /sales/orders`
List orders assigned to current sales rep.

### `POST /orders/:orderId/hold`
Put order on hold (prevents production).

### `POST /orders/:orderId/release`
Release order from hold.

### `GET /sales/payouts`
Get sales commission/payout history.

---

## 8. Admin APIs

### `GET /admin/users`
List all users (admin only).

### `PUT /admin/users/:userId`
Update user role or status.

### `GET /admin/stats`
Admin dashboard stats (total orders, revenue, active users).

---

## 9. Public Profile APIs (No Auth Required)

### `GET /u/:slug`
Get public profile by slug.
```json
// Response 200
{
  "displayName": "Chan Thean",
  "tagline": "Software Engineer",
  "photoUrl": "https://...",
  "whatsapp": "+855123456789",
  "telegram": "@chanthean",
  "customLinks": [
    { "label": "Portfolio", "url": "https://chanthean.com" }
  ],
  "theme": "vibrant_pink"
}
```

### `GET /c/:cardId`
Get card public profile by card ID.

### `POST /c/:cardId/tap`
Record an NFC tap event (analytics).

---

## 10. Bio Page APIs (Customer)

### `GET /bio`
Get current user's bio page.

### `PUT /bio`
Update bio page (displayName, tagline, theme, links).

### `POST /bio/photo`
Upload profile photo (multipart/form-data).

---

## 11. Notifications APIs

### `GET /notifications`
Get notifications for current user.

### `PUT /notifications/:id/read`
Mark notification as read.

---

## Firestore Collections -> API Mapping

| Collection | API Domain | Key Endpoints |
|-----------|-----------|---------------|
| `users` | Auth, Admin | `/auth/*`, `/admin/users` |
| `guests` | Guests | `/guests/*` |
| `guestSessions` | Guests | `/guests/*` (mirror) |
| `cards` | Cards | `/cards/*` |
| `orders` | Orders | `/orders/*` |
| `payments` | Payments | `/orders/:id/payment/*` |
| `transactions` | Finance | Internal ledger |
| `company_wallets` | Finance | Internal ledger |
| `bio_pages` | Bio | `/bio/*` |
| `profiles` | Public | `/u/:slug` |
| `nfc_cards` | Production | `/production/jobs/:id/nfc-write` |
| `printer_jobs` | Production | `/production/queue`, `/production/jobs/*` |
| `production_batches` | Production | Internal batching |
| `tap_events` | Analytics | `/c/:cardId/tap` |
| `notifications` | Notifications | `/notifications/*` |
| `products` | Catalog | `/products` (read-only) |
| `app_config` | System | Internal config |
| `invoices` | Finance | `/orders/:id/invoice` |
| `refunds` | Finance | `/orders/:id/refund` |
| `audit_logs` | System | Internal audit trail |

---

## Status Machines

### Order Status Flow
```
draft -> pending_payment -> payment_submitted -> payment_verified -> production_approved
  -> printer_assigned -> printing -> nfc_writing -> nfc_verification -> qa_pending
  -> ready_to_ship -> shipped -> delivered
```
Branches: `payment_rejected`, `qa_failed`, `cancelled`

### Card Status Flow
```
draft -> preview_ready -> ordered -> locked -> printed -> encoded -> verified -> active -> published
```

### Payment Status Flow
```
unpaid -> pending_payment -> under_review -> paid_verified / paid_qr / cash_received / paid
```

### Guest Status Flow
```
active -> converted
```

### Printer Job Stage Flow
```
received -> printing -> nfc_encoding -> quality_check -> ready_to_ship -> completed
```
Branches: `failed`, `reprint`
