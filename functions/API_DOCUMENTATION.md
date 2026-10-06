# Cloud Functions API Documentation

**Version**: 1.0.0  
**Base URL**: `https://us-central1-<project-id>.cloudfunctions.net`

---

## Authentication

All callable functions require Firebase Authentication:

```typescript
const auth = getAuth();
const idToken = await auth.currentUser.getIdToken();

fetch(functionUrl, {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

---

## Functions

### 1. createPaymentIntent

Creates a payment intent for checkout.

**Type**: `onCall` (Callable)  
**Endpoint**: `createPaymentIntent`  
**Auth Required**: Yes

#### Request

```typescript
{
  data: {
    amount: number;        // Amount in cents (e.g., 4900 = $49.00)
    currency: string;      // Currency code (USD, KHR, etc.)
    cardId: string;        // Card ID for this order
    paymentMethod?: string; // Optional: 'aba', 'khqr', 'cod', 'card'
  }
}
```

#### Response

```typescript
{
  result: {
    intentId: string;      // Payment intent ID
    clientSecret: string;  // Client secret for payment
    amount: number;
    currency: string;
    status: 'pending';
    expiresAt: Timestamp;
  }
}
```

#### Example

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createPayment = httpsCallable(functions, 'createPaymentIntent');

const result = await createPayment({
  amount: 4900,
  currency: 'USD',
  cardId: 'card_abc123'
});

console.log(result.data.result.clientSecret);
```

#### Errors

- `unauthenticated`: User not logged in
- `invalid-argument`: Missing or invalid parameters
- `permission-denied`: Account inactive

---

### 2. paymentWebhookAba

Handles ABA payment webhooks (server-to-server).

**Type**: `onRequest` (HTTP)  
**Endpoint**: `paymentWebhookAba`  
**Auth Required**: HMAC signature

#### Request

```http
POST /paymentWebhookAba
Content-Type: application/json
X-ABA-Signature: <hmac-sha256-signature>

{
  "transaction_id": "TXN123456",
  "order_id": "order_abc123",
  "amount": 49.00,
  "currency": "USD",
  "status": "success",
  "timestamp": "2026-10-06T12:00:00Z"
}
```

#### Response

```http
200 OK
{ "received": true }
```

#### Signature Verification

```typescript
const crypto = require('crypto');

const signature = req.headers['x-aba-signature'];
const payload = JSON.stringify(req.body);
const secret = process.env.ABA_WEBHOOK_SECRET;

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

#### Side Effects

- Updates `orders/{orderId}` → `paymentStatus: 'paid'`
- Creates notification for user
- Publishes card to `cards` collection

---

### 3. initiateRefund

Initiates a refund for a paid order.

**Type**: `onCall` (Callable)  
**Endpoint**: `initiateRefund`  
**Auth Required**: Yes (Admin, Sales, or Order Owner)

#### Request

```typescript
{
  data: {
    orderId: string;        // Order ID to refund
    amount?: number;        // Optional: partial refund amount
    reason?: string;        // Optional: refund reason
  }
}
```

#### Response

```typescript
{
  result: {
    refundId: string;       // Refund document ID
    orderId: string;
    amount: number;         // Refunded amount
    status: 'pending';
    createdAt: Timestamp;
  }
}
```

#### Example

```typescript
const initiateRefund = httpsCallable(functions, 'initiateRefund');

const result = await initiateRefund({
  orderId: 'order_abc123',
  amount: 49.00,
  reason: 'Customer requested cancellation'
});
```

#### Errors

- `permission-denied`: Not authorized to refund this order
- `failed-precondition`: Order not paid or already refunded
- `invalid-argument`: Refund amount exceeds paid amount

---

### 4. generateInvoice

Generates a PDF invoice for an order.

**Type**: `onCall` (Callable)  
**Endpoint**: `generateInvoice`  
**Auth Required**: Yes

#### Request

```typescript
{
  data: {
    orderId: string;        // Order ID to invoice
  }
}
```

#### Response

```typescript
{
  result: {
    invoiceNumber: string;  // e.g., "INV-20261006-ABC123"
    pdfUrl: string;         // Download URL (expires in 1 hour)
    orderId: string;
    amount: number;
    createdAt: Timestamp;
  }
}
```

#### Example

```typescript
const generateInvoice = httpsCallable(functions, 'generateInvoice');

const result = await generateInvoice({
  orderId: 'order_abc123'
});

// Download PDF
window.open(result.data.result.pdfUrl);
```

#### PDF Format

- A4 size (612 x 792 points)
- Contains: Invoice number, order details, line items, total
- Stored in Firestore `invoices` collection

---

## Rate Limiting

All functions have rate limiting:

- **Payment functions**: 100 requests per 15 minutes per IP
- **Webhooks**: 120 requests per minute per property
- **General functions**: 300 requests per 15 minutes per user

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1696598400
```

---

## Error Handling

All functions return consistent error format:

```typescript
{
  error: {
    code: 'permission-denied',
    message: 'You do not have permission to perform this action',
    details: {...}  // Optional additional info
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `unauthenticated` | User not logged in |
| `permission-denied` | Insufficient permissions |
| `invalid-argument` | Missing or invalid parameters |
| `not-found` | Resource not found |
| `already-exists` | Resource already exists |
| `resource-exhausted` | Rate limit exceeded |
| `failed-precondition` | Operation not allowed in current state |
| `internal` | Internal server error |

---

## Testing

### Development

```bash
# Use Firebase emulator
firebase emulators:start

# Call function locally
curl -X POST http://localhost:5001/<project>/us-central1/createPaymentIntent \
  -H "Content-Type: application/json" \
  -d '{"data": {"amount": 4900, "currency": "USD", "cardId": "test_123"}}'
```

### Production

```bash
# Test with real Firebase project
firebase use production
firebase functions:log --only createPaymentIntent --limit 10
```

---

## Monitoring

### Cloud Functions Console

https://console.firebase.google.com/project/<project-id>/functions

**Metrics**:
- Invocations per minute
- Execution time (p50, p95, p99)
- Error rate
- Memory usage

### Logs

```bash
# Real-time logs
firebase functions:log --follow

# Filter by function
firebase functions:log --only createPaymentIntent

# Filter by severity
firebase functions:log --only-with-severity error
```

---

## Security

### Secrets Management

```bash
# Set secret
firebase functions:secrets:set PAYMENT_SANDBOX_SECRET

# Access in code
const { defineSecret } = require('firebase-functions/params');
const secret = defineSecret('PAYMENT_SANDBOX_SECRET');

exports.myFunction = onRequest(
  { secrets: [secret] },
  (req, res) => {
    const value = secret.value();
  }
);
```

### CORS Configuration

```typescript
const cors = require('cors')({
  origin: ['https://nfcglobal.com', 'https://app.nfcglobal.com'],
  credentials: true,
});

exports.myFunction = onRequest((req, res) => {
  cors(req, res, () => {
    // Function logic
  });
});
```

---

## Deployment

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createPaymentIntent

# Deploy with forced update
firebase deploy --only functions --force
```

---

## Support

- **Documentation**: https://firebase.google.com/docs/functions
- **Status**: https://status.firebase.google.com
- **Issues**: GitHub repository issues
