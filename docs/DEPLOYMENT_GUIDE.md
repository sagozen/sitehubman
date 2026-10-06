# 🚀 SiteHubMan Production Deployment Guide

**Target**: 1 Million Users  
**Date**: 2026-10-06  
**Status**: Pre-Production (Payment Functions Required)

---

## ⚠️ CRITICAL: Pre-Deployment Requirements

### 1. Upgrade Firebase to Blaze Plan
**Why**: Cloud Functions with secrets require pay-as-you-go billing

```bash
# Check current plan
firebase projects:list

# Upgrade via Firebase Console
# https://console.firebase.google.com/project/sitehub-8dd56/usage/details
```

**Cost Estimate** (1M users):
- Functions: ~$50-200/month
- Firestore: ~$100-300/month  
- Storage: ~$20-50/month
- **Total**: ~$170-550/month

---

### 2. Initialize Firebase Storage
**Why**: Invoice PDFs need storage bucket

1. Go to Firebase Console → Storage
2. Click "Get Started"
3. Choose production location (asia-southeast1)
4. Deploy storage rules:

```bash
firebase deploy --only storage
```

---

## 🔐 Step 1: Set Environment Secrets

### Generate Sandbox Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Set Firebase Function Secrets
```bash
cd functions

# Payment secrets
firebase functions:secrets:set PAYMENT_SANDBOX_SECRET
# Paste generated secret above

firebase functions:secrets:set ABA_WEBHOOK_SECRET
# Get from ABA Bank merchant portal

firebase functions:secrets:set ABA_API_KEY
# Get from ABA Bank merchant portal

# Optional: Telegram login
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
# Get from @BotFather on Telegram
```

### Verify Secrets
```bash
firebase functions:secrets:access PAYMENT_SANDBOX_SECRET
```

---

## 📦 Step 2: Deploy Cloud Functions

### Install Dependencies
```bash
cd functions
npm install
```

### Deploy Payment Functions
```bash
firebase deploy --only functions:createPaymentIntent,functions:paymentWebhookAba,functions:paymentWebhookSandbox,functions:initiateRefund,functions:generateInvoice,functions:generatePaymentSandboxSecret
```

**Expected Output**:
```
✔  functions[createPaymentIntent(us-central1)] Successful create operation.
✔  functions[paymentWebhookAba(us-central1)] Successful create operation.
...
✔  Deploy complete!
```

### Get Webhook URLs
```bash
firebase functions:list
```

**Example URLs**:
- Sandbox: `https://us-central1-sitehub-8dd56.cloudfunctions.net/paymentWebhookSandbox`
- ABA: `https://us-central1-sitehub-8dd56.cloudfunctions.net/paymentWebhookAba`

---

## 🔒 Step 3: Deploy Firestore Rules & Indexes

### Deploy Rules (Block Client Payment Writes)
```bash
firebase deploy --only firestore:rules
```

**Critical Rule** (already in firestore.rules):
```
match /orders/{orderId} {
  allow update: if request.auth != null 
    && !request.resource.data.diff(resource.data)
        .affectedKeys().hasAny(['paymentStatus']);
}
```

### Deploy Indexes
```bash
firebase deploy --only firestore:indexes
```

**Required Indexes** (already in firestore.indexes.json):
- `payment_intents`: orderId + createdAt
- `payment_intents`: userId + status + createdAt
- `payment_events`: providerRef (unique lookup)
- `orders`: userId + status + createdAt
- `nfc_tags`: uidHash + status

### Verify Deployment
```bash
firebase firestore:indexes
```

---

## 🧪 Step 4: Test Payment Flow

### Test Sandbox Webhook
```bash
npm run test:payment:sandbox
```

**Expected Output**:
```
✓ Create payment intent
✓ Webhook marks order paid
✓ Card published
✓ Notification sent
All tests passed!
```

### Test from Mobile App
1. Open app → Design card → Checkout
2. Select payment method
3. Complete payment
4. Verify order status changes to "paid"
5. Check Firestore: `orders/{orderId}.paymentStatus === 'paid'`

---

## 🔔 Step 5: Configure ABA Bank Webhook

### 1. Register Webhook URL with ABA
**Merchant Portal**: https://merchant.ababank.com

**Webhook URL**:
```
https://us-central1-sitehub-8dd56.cloudfunctions.net/paymentWebhookAba
```

**Events to Subscribe**:
- Payment Success (status: 0)
- Payment Failed (status: 1)

### 2. Test ABA Webhook
ABA provides a sandbox testing tool. Send test payload:

```json
{
  "req_time": "1696588800",
  "merchant_id": "your_merchant_id",
  "tran_id": "test_intent_id",
  "amount": "49.00",
  "status": "0",
  "payment_type": "aba_pay",
  "hash": "computed_signature"
}
```

### 3. Verify Signature Validation
Check function logs:
```bash
firebase functions:log --only paymentWebhookAba --limit 50
```

**Expected**: No "SECURITY ALERT" logs

---

## 🛡️ Step 6: Enable App Check (Week 5)

### 1. Register App with App Check
```bash
# iOS
firebase apps:list
firebase apps:sdkconfig ios [APP_ID]

# Android
firebase apps:sdkconfig android [APP_ID]
```

### 2. Update app.json
```json
{
  "expo": {
    "plugins": [
      ["@react-native-firebase/app-check", {
        "provider": "deviceCheck"
      }]
    ]
  }
}
```

### 3. Enable in Functions
Update `functions/index.js`:
```javascript
function shouldEnforceAppCheck() {
  return process.env.APP_CHECK_ENFORCED === 'true';
}
```

Set environment variable:
```bash
firebase functions:config:set app.check_enforced=true
firebase deploy --only functions
```

---

## 📊 Step 7: Enable Monitoring

### 1. Sentry Error Tracking
```bash
npm install @sentry/react-native
npx @sentry/wizard@latest -i reactNative
```

Add to `app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 2. Firebase Performance Monitoring
Already configured in `app.json`:
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/perf"
    ]
  }
}
```

### 3. Custom Analytics Events
```typescript
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('payment_success', {
  orderId,
  amount,
  method: 'aba_pay',
});
```

---

## ⚡ Step 8: Performance Optimization

### 1. Enable Production Mode
```bash
# .env.production
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://api.sitehub.app
```

### 2. Build Optimized Bundle
```bash
npx expo build:configure
npx eas build --platform all --profile production
```

### 3. Enable Code Splitting
Already configured in `metro.config.js`:
```javascript
module.exports = {
  transformer: {
    minifierConfig: {
      compress: {
        drop_console: true,
      },
    },
  },
};
```

---

## 🚀 Step 9: Deploy Mobile App

### iOS (TestFlight)
```bash
npm run eas:build:ios:testflight
npm run eas:submit:ios:testflight
```

**Review Time**: 24-48 hours

### Android (Google Play)
```bash
npx eas build --platform android --profile production
npx eas submit --platform android
```

**Review Time**: 1-7 days

---

## 🔄 Step 10: OTA Updates (Expo)

### Push Update to Production
```bash
npm run eas:update:production
```

**Reaches Users**: <5 minutes  
**No App Store Review**: ✅

**Limitations**:
- JavaScript-only changes
- No native code changes
- No manifest changes

---

## ✅ Post-Deployment Verification

### 1. Health Check Endpoints
```bash
# Test payment intent creation
curl -X POST https://us-central1-sitehub-8dd56.cloudfunctions.net/createPaymentIntent \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test123","methodId":"aba_pay"}'
```

**Expected**: 200 OK with intentId

### 2. Monitor Error Rates
**Firebase Console** → Functions → Logs

**Target Metrics**:
- Error rate: <1%
- P95 latency: <2s
- Cold start: <5s

### 3. Check Firestore Quotas
**Firebase Console** → Firestore → Usage

**1M User Estimates**:
- Reads: 50M/day
- Writes: 10M/day
- Storage: 50GB

**Monthly Cost**: ~$150-300

### 4. Verify Payment Success Rate
Query `payment_intents`:
```javascript
const successRate = paidCount / totalCount;
// Target: >95%
```

---

## 🐛 Troubleshooting

### Payment Function Fails
**Error**: "Missing bearer token"

**Fix**:
```typescript
// Ensure auth token in request
const functions = getFunctions(firebaseApp);
const callable = httpsCallable(functions, 'createPaymentIntent');
```

---

### Webhook Not Received
**Error**: No logs in Firebase Functions

**Check**:
1. Webhook URL registered in ABA portal
2. Firestore rules allow Functions write
3. CORS enabled in function

---

### App Check Blocks Requests
**Error**: "AppCheck token invalid"

**Fix**:
```bash
# Disable App Check temporarily
firebase functions:config:unset app.check_enforced
firebase deploy --only functions
```

---

### Firestore Permission Denied
**Error**: "Missing or insufficient permissions"

**Fix**: Check `firestore.rules`:
```
match /payment_intents/{intentId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow write: false; // Only Functions can write
}
```

---

## 📈 Scale Testing

### Load Test Script
```bash
# Simulate 10k concurrent users
npm install -g artillery
artillery quick --count 10000 --num 50 https://your-app-url/api/health
```

**Target P95**: <2s response time

### Firestore Scaling
**Automatic** up to:
- 10k writes/second
- 100k reads/second
- 1 TB storage

**Manual Tuning**:
- Composite indexes
- Denormalization
- Read replicas (Firebase Extensions)

---

## 🎯 Success Criteria

### Before Going Live
- [ ] Payment sandbox test passes
- [ ] ABA webhook receives test payload
- [ ] Firestore rules block client `paid` writes
- [ ] All indexes deployed
- [ ] Storage rules deployed
- [ ] Sentry configured
- [ ] Performance monitoring enabled
- [ ] Load test passes (10k users)
- [ ] Error rate <1%
- [ ] Payment success rate >95%

### Week 1 Metrics
- [ ] 100 orders paid via webhook
- [ ] Zero manual `paid` overrides
- [ ] Zero security incidents
- [ ] <5% support tickets
- [ ] Average payment time <2 minutes

---

## 🆘 Emergency Rollback

### Revert Functions
```bash
firebase functions:delete createPaymentIntent
firebase functions:delete paymentWebhookAba

# Redeploy previous version
git checkout previous-tag
cd functions && npm install
firebase deploy --only functions
```

### Revert Firestore Rules
```bash
git checkout previous-tag
firebase deploy --only firestore:rules
```

### Disable OTA Update
```bash
# Publish rollback update
npm run eas:update:production -- --message "Rollback: reverting to stable"
```

---

## 📞 Support Contacts

| Issue | Contact |
|-------|---------|
| Firebase Console | console.firebase.google.com |
| ABA Bank Support | merchant-support@ababank.com |
| Expo EAS | expo.dev/support |
| Sentry | support@sentry.io |

---

## 🎉 Launch Checklist

### Day -7 (Pre-Launch)
- [ ] Payment Functions deployed
- [ ] ABA webhook configured
- [ ] Load testing complete
- [ ] Monitoring dashboards setup

### Day -3
- [ ] Final sandbox test
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] Backup plan tested

### Day 0 (Launch Day)
- [ ] Deploy mobile app updates
- [ ] Push OTA update
- [ ] Enable production secrets
- [ ] Monitor error rates (hourly)
- [ ] Check payment success rate
- [ ] Response to support tickets <1h

### Day +1
- [ ] Review metrics dashboard
- [ ] Check for fraud attempts
- [ ] Verify payment reconciliation
- [ ] Customer feedback survey

### Day +7 (Post-Launch)
- [ ] Analyze conversion funnel
- [ ] Identify bottlenecks
- [ ] Plan Week 2 optimizations
- [ ] Celebrate 🎉

---

**Ready to launch! 🚀**

📊 Live Edit Summary: +450 green lines / -0 red lines
