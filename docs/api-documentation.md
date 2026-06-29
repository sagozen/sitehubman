# SiteHubMan — API & Database Documentation

> Backend developer reference for the Guest-to-Customer identity flow,
> Firestore schema, ID conventions, and status machines.

---

## 1. ID Formats & Conventions

| Entity | Prefix | Example | Storage |
|--------|--------|---------|---------|
| Guest ID | `GST_` | `GST_a1B2c3D4` | Firestore doc ID in `guests/` |
| Card ID | `BC-NFC_` | `BC-NFC_X7K2M9QP` | Firestore doc ID in `cards/` |
| Order (doc ID) | *(auto)* | `abc123xyz` | Firestore auto-generated |
| Order Number | `ORD_` | `ORD_f4G7h8J2` | Field `orderNumber` on order doc |
| User / Customer ID | *(Firebase UID)* | `uid_abc123` | Firebase Auth UID |
| Profile Slug | *(name-based)* | `chanthean-a1b2c3` | Field `publicSlug` on card doc |

### Rules
- **Firestore document IDs** are never changed after creation.
- **Order Number** (`ORD_`) is a human-readable business reference — NOT the Firestore doc ID.
- **Guest ID** (`GST_`) is temporary. It is preserved on documents after conversion for audit trail.
- **Card ID** (`BC-NFC_`) and **Order Number** (`ORD_`) are stable and survive guest→customer conversion.

---

## 2. Firestore Collections Schema

### `guests/{guestId}`

```typescript
{
  guestId: string;            // GST_xxxxxxxx
  cardId: string;             // BC-NFC_XXXXXXXX
  ownerId: string;            // Same as guestId initially
  ownerType: 'guest';         // Always 'guest' at creation
  status: 'active' | 'converted';
  sessionOwnerUid: string;    // Firebase Auth UID (anonymous or signed-in)
  guestAccessKey: string;     // Secret key for session verification
  convertedToUserId?: string; // Set on conversion
  convertedAt?: string;       // ISO timestamp of conversion
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `guestSessions/{guestId}`

Mirror of `guests/{guestId}` — same schema. Exists for backward compatibility.

### `users/{userId}`

```typescript
{
  id: string;                 // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'customer' | 'sales' | 'printer' | 'qa_inspector' | 'admin' | 'super_admin';
  phone?: string;
  language: string;           // 'en' | 'km'
  isActive: boolean;
  authType?: 'email' | 'google' | 'apple' | 'telegram';
  authProvider?: 'email' | 'google' | 'apple' | 'telegram';
  plan?: 'guest_trial' | 'free' | 'pro' | 'physical_card';
  trialStartedAt?: string;
  trialEndsAt?: string;
  branch?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `cards/{cardId}`

```typescript
{
  cardId: string;             // BC-NFC_XXXXXXXX (same as doc ID)
  ownerType: 'guest' | 'customer';
  ownerId: string;            // guestId (GST_) or userId (Firebase UID)
  guestId: string;            // Original GST_ ID — preserved after conversion
  userId: string | null;      // Firebase UID — set after conversion
  previousGuestId?: string;   // Set during conversion for audit

  publicSlug: string;         // e.g. 'chanthean-a1b2c3'
  publicProfileUrl: string;   // Full URL to public profile

  status: 'draft' | 'preview_ready' | 'ordered' | 'locked' | 'printed' | 'encoded' | 'verified' | 'active' | 'published';
  designLocked: boolean;

  profile: {
    fullName: string;
    role: string;
    company: string;
    phone: string;
    telegram: string;
    email: string;
    website: string;
    address: string;
    bio: string;
  };

  design: {
    theme: string;
    backgroundColor: string;
    accentColor: string;
    logoUrl: string | null;
    avatarUrl: string | null;
    cardDesign: string;       // 'classic_black' | 'classic_white' | etc.
    product: string;          // 'pvc_card' | 'metal_card' | etc.
    cardChoice: string;       // 'physical' | 'ecard'
    gradientIndex?: number;
    customImageUri?: string | null;
  };

  orderId?: string;           // Linked order Firestore doc ID
  sessionOwnerUid: string;
  guestAccessKey: string;
  lockedPublicProfileUrl?: string;
  printProfileUrl?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `orders/{autoId}`

```typescript
{
  // Identity fields
  orderNumber?: string;       // ORD_xxxxxxxx — human-readable reference
  cardId: string;             // BC-NFC_XXXXXXXX
  guestId: string;            // Original GST_ creator
  ownerId: string;            // guestId initially, userId after conversion
  ownerType: 'guest' | 'customer';
  userId: string;             // Firebase UID — set after conversion
  guestAccessKey: string;

  // Customer info
  customerName: string;
  phone: string;
  email?: string;
  telegram?: string;
  company?: string;
  jobTitle?: string;
  deliveryAddress?: string;

  // Product info
  productType: string;        // 'physical_nfc' | 'ecard'
  quantity: number;
  cardDesign: string;
  cardCode: string;           // Same as cardId
  profileUrl: string;
  nfcEnabled: boolean;
  nfcTargetUrl?: string;
  qrPrinted: boolean;
  fulfillment: 'digital' | 'physical';

  // Payment
  paymentStatus: 'unpaid' | 'pending_payment' | 'under_review' | 'paid_verified' | 'partial' | 'paid' | 'paid_qr' | 'cash_received';
  paymentMethod?: string;
  paymentReference?: string;
  amount?: number;
  currency?: 'USD' | 'KHR';

  // Workflow
  status: 'draft' | 'new' | 'pending_payment' | 'payment_submitted' | 'payment_verified' | 'production_approved' | 'printer_assigned' | 'printing' | 'nfc_writing' | 'nfc_verification' | 'qa_pending' | 'ready_to_ship' | 'shipped' | 'delivered' | 'payment_rejected' | 'qa_failed' | 'cancelled';
  orderSource: 'guest' | 'customer' | 'manual' | 'bulk';

  // Sales
  assignedSalesman: string;   // Sales rep Firebase UID
  salesApprovedAt?: string;   // Required before production
  salesApprovedBy?: string;
  onHold?: boolean;
  branch?: string;

  // Tracking
  createdBy: string;          // Firebase UID
  updatedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Identity Flow

```
┌─────────────┐
│  Guest opens │
│     app      │
└──────┬───────┘
       ▼
┌─────────────┐     AsyncStorage
│ Create       │───► guestId (GST_xxx)
│ guestId      │     cardId  (BC-NFC_xxx)
└──────┬───────┘     guestAccessKey
       ▼
┌─────────────┐     Firestore: cards/{cardId}
│ Guest designs│───► ownerType: 'guest'
│ card         │     ownerId: GST_xxx
└──────┬───────┘     status: 'draft'
       ▼
┌─────────────┐     Firestore: cards/{cardId}
│ Guest        │───► status: 'preview_ready'
│ previews     │
└──────┬───────┘
       ▼
┌─────────────┐
│ Guest starts │
│ checkout     │
└──────┬───────┘
       ▼
┌──────────────────────────────────────┐
│ CONVERSION: Guest → Customer         │
│                                      │
│ 1. Guest registers or signs in       │
│ 2. Create userId (Firebase Auth UID) │
│ 3. Transfer all guest cards:         │
│    ownerType → 'customer'            │
│    ownerId → userId                  │
│ 4. Transfer all guest orders:        │
│    ownerId → userId                  │
│    userId → userId                   │
│ 5. Update guests/{guestId}:          │
│    status → 'converted'              │
│    convertedToUserId → userId        │
│ 6. PRESERVE: cardId, orderId,        │
│    orderNumber, publicSlug           │
└──────────────┬───────────────────────┘
               ▼
┌─────────────┐
│ Customer     │───► Route: /customer
│ dashboard    │
└──────────────┘
```

---

## 4. Production Guard

Production can **ONLY** start when ALL three conditions are met:

| Check | Field | Condition |
|-------|-------|-----------|
| **Customer exists** | `ownerId` / `userId` | NOT starting with `GST_` |
| **Payment verified** | `paymentStatus` | One of: `paid`, `paid_verified`, `paid_qr`, `cash_received` |
| **Sales approved** | `salesApprovedAt` | Exists AND `onHold !== true` |

### API: `canStartProduction(orderId)`

Returns:
```typescript
{
  ready: boolean;
  checks: {
    hasCustomerId: boolean;
    paymentVerified: boolean;
    salesApproved: boolean;
  };
  blockers: string[];  // Human-readable list
}
```

---

## 5. Route Access Matrix

| Route | Auth Required | Allowed Roles | Notes |
|-------|--------------|---------------|-------|
| `/(auth)/login` | No | Public | |
| `/(auth)/register` | No | Public | |
| `/cards/design` | No | guest, customer | Guest can design |
| `/cards/preview/{cardId}` | No | guest, customer | Guest can preview |
| `/checkout/{cardId}` | Yes (anonymous OK) | guest, customer | Must convert before payment |
| `/customer` | Yes | customer | Customer dashboard (default landing) |
| `/(tabs)` | Yes | customer | Customer tabs |
| `/orders/track` | Yes | customer | |
| `/orders/detail/{orderId}` | Yes | customer, sales, admin | Shared order detail |
| `/profile` | Yes | customer | |
| `/settings` | Yes | customer | |
| `/u/{slug}` | No | Public | Public bio URL |
| `/sales/dashboard` | Yes | sales, admin | |
| `/sales/orders` | Yes | sales, admin | |
| `/production/queue` | Yes | printer, qa, admin | |
| `/admin/dashboard` | Yes | super_admin | |

---

## 6. Guest-to-Customer Conversion API

### `convertGuestToCustomer(user, cardId?)`

**When to call:** After successful `signIn()` or `signUp()` when a guest session exists in AsyncStorage.

**Input:**
- `user: AppUser` — The newly authenticated user
- `cardId?: string` — Optional specific card to convert (auto-detected from session if omitted)

**Output:**
```typescript
{
  success: boolean;
  guestId: string | null;
  customerId: string;
  cardsConverted: number;
  ordersConverted: number;
  errors: string[];
}
```

**What changes in Firestore:**

| Collection | Field | Before | After |
|-----------|-------|--------|-------|
| `cards/{cardId}` | `ownerType` | `'guest'` | `'customer'` |
| `cards/{cardId}` | `ownerId` | `GST_xxx` | `userId` |
| `cards/{cardId}` | `userId` | `null` | `userId` |
| `cards/{cardId}` | `previousGuestId` | *(absent)* | `GST_xxx` |
| `orders/{orderId}` | `ownerType` | `'guest'` | `'customer'` |
| `orders/{orderId}` | `ownerId` | `GST_xxx` | `userId` |
| `orders/{orderId}` | `userId` | *(absent)* | `userId` |
| `guests/{guestId}` | `status` | `'active'` | `'converted'` |
| `guests/{guestId}` | `convertedToUserId` | *(absent)* | `userId` |

**What is NEVER changed:**
- `cardId` (BC-NFC_xxx)
- `orderId` (Firestore doc ID)
- `orderNumber` (ORD_xxx)
- `publicSlug`
- `guestId` (preserved on all docs for audit)

---

## 7. Status Machines

### Card Status Flow
```
draft → preview_ready → ordered → locked → printed → encoded → verified → active → published
```

### Order Status Flow
```
draft → pending_payment → payment_submitted → payment_verified → production_approved
  → printer_assigned → printing → nfc_writing → nfc_verification → qa_pending
  → ready_to_ship → shipped → delivered
```

Branch: `payment_rejected`, `qa_failed`, `cancelled`

### Payment Status Flow
```
unpaid → pending_payment → under_review → paid_verified
                                        → paid_qr (QR confirmed)
                                        → cash_received (cash confirmed)
                                        → paid (generic confirmed)
```

### Guest Status Flow
```
active → converted
```
