# 🔧 AVIO TECHNICAL INTEGRATION GUIDE
## How to integrate subscription monetization with your existing app

---

## 🔍 **YOUR CURRENT TECH STACK**

Based on your codebase analysis:
- ✅ **React Native** (Expo 54)
- ✅ **Firebase** (Firestore, Auth, Functions)
- ✅ **TypeScript** 
- ✅ **Expo Router** (file-based routing)
- ✅ **Payment processing** (Cambodia methods + Stripe ready)
- ✅ **Order management** system
- ✅ **Design system** with theme support

---

## 📝 **STEP-BY-STEP INTEGRATION**

### **STEP 1: Add Subscription Files to Your Project**

**Copy these files I created:**
```bash
# Subscription system
cp src/constants/subscriptionPlans.ts your-project/src/constants/
cp src/hooks/useSubscription.ts your-project/src/hooks/  
cp src/services/subscriptionService.ts your-project/src/services/
cp src/components/PaywallBanner.tsx your-project/src/components/

# New screens
cp app/pricing.tsx your-project/app/
cp app/cards/upgrade.tsx your-project/app/cards/

# Web landing page (if using web)
cp web/pages/index.tsx your-project/web/pages/
```

### **STEP 2: Update Package Dependencies**

**File: `package.json`**
```json
{
  "dependencies": {
    // ... your existing dependencies
    "stripe": "^14.0.0",
    "@stripe/stripe-js": "^2.0.0"
  }
}
```

**Install:**
```bash
npm install stripe @stripe/stripe-js
```

### **STEP 3: Environment Variables**

**File: `.env`**
```env
# Add these to your existing .env file
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Your existing variables stay the same
EXPO_PUBLIC_API_URL=your-api-url
```

### **STEP 4: Update Firebase Schema**

**Add new Firestore collections:**

**Collection: `subscriptions/{userId}`**
```javascript
{
  id: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planId: 'free' | 'pro' | 'business' | 'enterprise',
  status: 'active' | 'canceled' | 'past_due' | 'trialing',
  currentPeriodStart: timestamp,
  currentPeriodEnd: timestamp,
  cancelAtPeriodEnd: boolean,
  created: timestamp,
  updated: timestamp
}
```

**Collection: `usage/{userId}`**
```javascript
{
  digitalCards: number,
  taps: number,
  connections: number,
  exports: number,
  teamMembers: number,
  lastUpdated: timestamp,
  monthlyReset: timestamp
}
```

### **STEP 5: Update Existing Screens**

**A. Update your main layout to include subscription provider**

**File: `app/_layout.tsx`** (modify existing)
```tsx
import { SubscriptionProvider } from '@/src/providers/SubscriptionProvider';

export default function RootLayout() {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GuestGateProvider>
        <SubscriptionProvider> {/* Add this */}
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="pricing" options={{ title: 'Pricing' }} />
            {/* Your existing screens */}
          </Stack>
        </SubscriptionProvider>
      </GuestGateProvider>
    </ThemeProvider>
  );
}
```

**B. Create Subscription Provider**

**File: `src/providers/SubscriptionProvider.tsx`** (new file)
```tsx
import React, { createContext, useContext } from 'react';
import { useSubscription } from '@/src/hooks/useSubscription';

const SubscriptionContext = createContext<any>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const subscription = useSubscription();
  
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
};
```

**C. Update your connections/analytics screen**

**File: `app/(tabs)/connections.tsx`** (modify existing)
```tsx
import { PaywallBanner } from '@/src/components/PaywallBanner';
import { useSubscription } from '@/src/hooks/useSubscription';

export default function ConnectionsScreen() {
  const { hasAccess, currentPlan } = useSubscription();
  
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Connections" />
      
      {/* Your existing connections list */}
      <IosScrollView>
        {/* ... existing connection items ... */}
        
        {/* Add export functionality with paywall */}
        <View style={styles.exportSection}>
          {hasAccess('exportContacts') ? (
            <AppButton 
              label="Export Connections"
              iconName="Download"
              onPress={handleExport}
            />
          ) : (
            <>
              <AppButton 
                label="Export Connections (Pro Feature)"
                iconName="Lock"
                disabled
                onPress={() => {}} // Disabled
              />
              <PaywallBanner 
                feature="Export Contacts"
                description="Export your connections to CSV, vCard, or sync with your CRM"
                requiredPlan="pro"
              />
            </>
          )}
        </View>
      </IosScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles
  exportSection: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
});
```

### **STEP 6: Update Order Flow with Subscription Benefits**

**File: `src/features/orders/NewOrderScreen2.tsx`** (modify existing)
```tsx
import { useSubscription } from '@/src/hooks/useSubscription';
import { CARD_PRODUCTS } from '@/src/constants/cardProducts';

export function NewOrderScreen() {
  const { currentPlan, hasAccess } = useSubscription();
  // ... your existing state

  // Add subscription discount logic
  const getCardPrice = (cardType: string) => {
    const product = CARD_PRODUCTS[cardType];
    if (!product) return 0;
    
    let price = product.price;
    
    // Apply subscription discounts
    if (currentPlan.id === 'pro') {
      price = price * 0.9; // 10% discount for Pro
    } else if (currentPlan.id === 'business') {
      price = price * 0.8; // 20% discount for Business
    }
    
    return price;
  };

  // Show subscription benefits in UI
  const renderSubscriptionBenefits = () => {
    if (currentPlan.id === 'free') return null;
    
    return (
      <View style={styles.benefitsCard}>
        <AppText style={styles.benefitsTitle}>
          🎉 {currentPlan.name} Member Benefits
        </AppText>
        <AppText style={styles.benefitsText}>
          {currentPlan.id === 'pro' 
            ? '10% discount on all physical cards' 
            : '20% discount on all physical cards'}
        </AppText>
        {currentPlan.id === 'business' && (
          <AppText style={styles.benefitsText}>
            + Bulk ordering available
          </AppText>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Your existing header */}
      
      <IosScrollView>
        {renderSubscriptionBenefits()}
        
        {/* Your existing form fields */}
        
        {/* Update pricing display */}
        <View style={styles.pricingCard}>
          <Text style={styles.originalPrice}>
            Original: ${selectedProduct.price}
          </Text>
          {currentPlan.id !== 'free' && (
            <Text style={styles.discountedPrice}>
              Your Price: ${getCardPrice(selectedProduct.value)}
            </Text>
          )}
        </View>
        
        {/* Your existing submit logic */}
      </IosScrollView>
    </SafeAreaView>
  );
}
```

### **STEP 7: Add Usage Tracking**

**Update your tap tracking logic**

**File: `src/services/nfcService.ts`** (modify existing or create)
```tsx
import { subscriptionService, trackCardTapped } from '@/src/services/subscriptionService';
import { useSubscription } from '@/src/hooks/useSubscription';

export async function handleCardTap(cardId: string, userId: string) {
  // Your existing tap logic
  await recordTapAnalytics(cardId, userId);
  
  // Add usage tracking for subscriptions
  await trackCardTapped(userId);
  
  // Check limits for free users
  const { isWithinLimit } = useSubscription();
  if (!isWithinLimit('taps')) {
    // Show upgrade modal
    showUpgradePrompt('Monthly tap limit reached', 'pro');
  }
}

function showUpgradePrompt(message: string, requiredPlan: string) {
  Alert.alert(
    'Upgrade Required',
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Upgrade Now', 
        onPress: () => router.push('/pricing')
      },
    ]
  );
}
```

### **STEP 8: Firebase Functions (Backend)**

**File: `functions/src/index.ts`** (add to existing)
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

// Stripe webhook handler
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      functions.config().stripe.webhook_secret
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateUserSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await cancelUserSubscription(event.data.object as Stripe.Subscription);
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(error.message);
  }
});

async function updateUserSubscription(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  await admin.firestore()
    .collection('subscriptions')
    .doc(userId)
    .set({
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      planId: subscription.metadata.planId || 'free',
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updated: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
}
```

### **STEP 9: Update App Navigation**

**File: `app/(tabs)/_layout.tsx`** (modify existing)
```tsx
import { useSubscription } from '@/src/hooks/useSubscription';

export default function TabLayout() {
  const { currentPlan } = useSubscription();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      
      {/* Your existing tabs */}
      
      {/* Add settings tab with subscription info */}
      <Tabs.Screen
        name="settings"
        options={{
          title: currentPlan.id === 'free' ? 'Settings' : `Settings (${currentPlan.name})`,
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
          tabBarBadge: currentPlan.id === 'free' ? 'Upgrade' : undefined,
        }}
      />
    </Tabs>
  );
}
```

### **STEP 10: Update Settings Screen**

**File: `app/(tabs)/settings.tsx`** (modify existing)
```tsx
import { useSubscription } from '@/src/hooks/useSubscription';
import { PaywallBanner } from '@/src/components/PaywallBanner';

export default function SettingsScreen() {
  const { currentPlan, subscription, loading } = useSubscription();
  
  const handleManageBilling = () => {
    // Open Stripe customer portal
    subscriptionService.updatePaymentMethod();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Settings" />
      
      <IosScrollView>
        {/* Subscription Status Card */}
        <View style={styles.subscriptionCard}>
          <AppText style={styles.planName}>
            Current Plan: {currentPlan.name}
          </AppText>
          {currentPlan.id !== 'free' ? (
            <>
              <AppText style={styles.planPrice}>
                ${currentPlan.priceMonthly}/month
              </AppText>
              <AppText style={styles.planFeatures}>
                {currentPlan.features.digitalCards === 'unlimited' 
                  ? 'Unlimited cards' 
                  : `${currentPlan.features.digitalCards} cards`}
              </AppText>
              <AppButton 
                label="Manage Billing"
                variant="outline"
                onPress={handleManageBilling}
              />
            </>
          ) : (
            <PaywallBanner 
              feature="Premium Features"
              description="Unlock unlimited cards, advanced analytics, and more"
              requiredPlan="pro"
              compact
            />
          )}
        </View>
        
        {/* Your existing settings items */}
        
      </IosScrollView>
    </SafeAreaView>
  );
}
```

---

## 🚀 **TESTING & DEPLOYMENT**

### **Local Testing:**
```bash
# 1. Start your app
npm run start

# 2. Test these flows:
# - Visit /pricing page
# - Try to export contacts (should show paywall)
# - Create digital card (should track usage)
# - Order physical card (should show discounts for paid users)
```

### **Stripe Testing:**
```javascript
// Use test card numbers
const testCards = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient: '4000000000009995',
};
```

### **Firebase Rules Update:**
```javascript
// Add to firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your existing rules...
    
    match /subscriptions/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /usage/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📊 **ANALYTICS & MONITORING**

### **Key Metrics to Track:**
```typescript
// Add to your analytics service
export const trackSubscriptionEvent = (event: string, data: any) => {
  // Your existing analytics (Firebase Analytics, Mixpanel, etc.)
  analytics.track('Subscription ' + event, {
    planId: data.planId,
    userId: data.userId,
    revenue: data.revenue,
    timestamp: Date.now(),
  });
};
```

### **Events to Track:**
- Pricing page viewed
- Plan selected
- Payment completed
- Subscription canceled
- Feature paywall shown
- Feature paywall converted
- Usage limit reached

---

## ⚠️ **IMPORTANT NOTES**

### **1. Backward Compatibility**
- All existing users become "free" plan automatically
- No existing functionality is removed
- Physical card ordering still works exactly the same

### **2. Data Migration**
```javascript
// Run this once to set up existing users
async function migrateExistingUsers() {
  const users = await admin.firestore().collection('users').get();
  
  const batch = admin.firestore().batch();
  
  users.docs.forEach(doc => {
    const subscriptionRef = admin.firestore()
      .collection('subscriptions')
      .doc(doc.id);
    
    batch.set(subscriptionRef, {
      planId: 'free',
      status: 'active',
      created: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  
  await batch.commit();
  console.log(`Migrated ${users.docs.length} users to free plan`);
}
```

### **3. Error Handling**
```typescript
// Add proper error handling for subscription operations
try {
  await subscriptionService.upgrade('pro', false);
} catch (error) {
  if (error.code === 'payment_failed') {
    Alert.alert('Payment Failed', 'Please try a different payment method.');
  } else if (error.code === 'subscription_exists') {
    Alert.alert('Already Subscribed', 'You already have an active subscription.');
  } else {
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
}
```

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Before Going Live:**
- [ ] Test all payment flows with Stripe test cards
- [ ] Verify Firebase rules are secure
- [ ] Test subscription webhooks
- [ ] Check all existing features still work
- [ ] Test on both iOS and Android
- [ ] Verify web version (if applicable)
- [ ] Set up monitoring/alerting for payment failures

### **Go Live:**
- [ ] Switch to Stripe live keys
- [ ] Deploy Firebase functions
- [ ] Update app store descriptions
- [ ] Send announcement email
- [ ] Monitor first 24 hours closely

---

## 🎯 **EXPECTED RESULTS**

### **Week 1 After Launch:**
- 5-15% of existing users will explore pricing
- 2-5% will upgrade to paid plans
- Physical card sales will increase 20-40%

### **Month 1:**
- $5,000-$15,000 in new MRR
- 100-300 paid subscribers
- Improved user engagement metrics

### **Month 3:**
- $25,000-$50,000 in MRR
- Clear path to $100k+ annual recurring revenue

---

**🚀 Your AVIO app now has everything it needs to become a profitable SaaS business. Follow this guide step by step and you'll be collecting recurring revenue within days!**

**Questions about any step? Need help debugging? Just ask! 💪**