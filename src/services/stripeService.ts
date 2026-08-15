// Stripe Backend Service Implementation
// Backend API endpoints for payment processing

// @ts-ignore
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Create or retrieve Stripe customer
export async function createOrGetStripeCustomer(
  userId: string,
  email: string,
  name: string
): Promise<Stripe.Customer> {
  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create checkout session for subscription
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  userId: string,
  planId: string,
  trialDays: number = 14,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          userId,
          planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create checkout session for physical products
export async function createProductCheckout(
  customerId: string,
  items: Array<{
    priceId: string;
    quantity: number;
    productData?: {
      name: string;
      description?: string;
      images?: string[];
      metadata?: Record<string, string>;
    };
  }>,
  userId: string,
  successUrl: string,
  cancelUrl: string,
  shippingRates?: string[]
): Promise<Stripe.Checkout.Session> {
  try {
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productData?.name || 'Custom Product',
          description: item.productData?.description,
          images: item.productData?.images || [],
          metadata: item.productData?.metadata || {},
        },
        unit_amount: Math.round(parseFloat(item.priceId) * 100), // Assuming priceId is actually the price
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT'],
      },
      shipping_options: shippingRates ? shippingRates.map(rate => ({
        shipping_rate: rate,
      })) : [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // Free shipping
              currency: 'usd',
            },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 7,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
      ],
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: {
        userId,
        orderType: 'physical_cards',
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating product checkout:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

// Create billing portal session
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// Handle webhook events
export async function handleWebhook(
  rawBody: string | Buffer,
  signature: string,
  onCustomerSubscriptionCreated: (subscription: Stripe.Subscription) => Promise<void>,
  onCustomerSubscriptionUpdated: (subscription: Stripe.Subscription) => Promise<void>,
  onCustomerSubscriptionDeleted: (subscription: Stripe.Subscription) => Promise<void>,
  onInvoicePaymentSucceeded: (invoice: Stripe.Invoice) => Promise<void>,
  onInvoicePaymentFailed: (invoice: Stripe.Invoice) => Promise<void>,
  onCheckoutSessionCompleted: (session: Stripe.Checkout.Session) => Promise<void>
): Promise<void> {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Invalid webhook signature');
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      await onCustomerSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await onCustomerSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await onCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await onInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'checkout.session.completed':
      await onCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  updates: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  try {
    return await stripe.subscriptions.update(subscriptionId, updates);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

// Create coupon
export async function createCoupon(
  id: string,
  percentOff: number,
  duration: 'forever' | 'once' | 'repeating',
  durationInMonths?: number,
  maxRedemptions?: number
): Promise<Stripe.Coupon> {
  try {
    const coupon = await stripe.coupons.create({
      id,
      percent_off: percentOff,
      duration,
      duration_in_months: durationInMonths,
      max_redemptions: maxRedemptions,
    });

    return coupon;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

// Validate coupon
export async function validateCoupon(couponId: string): Promise<Stripe.Coupon | null> {
  try {
    const coupon = await stripe.coupons.retrieve(couponId);
    
    // Check if coupon is valid
    if (coupon.valid === false) {
      return null;
    }

    // Check max redemptions
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return null;
    }

    return coupon;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return null;
  }
}

// Get customer payment methods
export async function getCustomerPaymentMethods(
  customerId: string,
  type: 'card' | 'bank_account' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type,
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Error retrieving payment methods:', error);
    throw error;
  }
}

// Create usage record (for metered billing)
export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  try {
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItemId,
      {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    return usageRecord;
  } catch (error) {
    console.error('Error creating usage record:', error);
    throw error;
  }
}

// Get customer invoices
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    throw error;
  }
}

// Retry failed payment
export async function retryFailedPayment(invoiceId: string): Promise<Stripe.Invoice> {
  try {
    const invoice = await stripe.invoices.pay(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Error retrying payment:', error);
    throw error;
  }
}

// Get payment intent for setup
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    return setupIntent;
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

// Analytics helpers
export async function getSubscriptionAnalytics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalRevenue: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  activeSubscriptions: number;
}> {
  try {
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Get invoices for revenue calculation
    const invoices = await stripe.invoices.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      status: 'paid',
      limit: 100, // Adjust as needed
    });

    const totalRevenue = invoices.data.reduce((sum, invoice) => {
      return sum + (invoice.amount_paid / 100); // Convert from cents
    }, 0);

    // Get subscriptions created in period
    const newSubscriptions = await stripe.subscriptions.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    });

    // Get canceled subscriptions
    const canceledSubscriptions = await stripe.subscriptions.list({
      status: 'canceled',
      canceled_at: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    });

    // Get active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    return {
      totalRevenue,
      newSubscriptions: newSubscriptions.data.length,
      canceledSubscriptions: canceledSubscriptions.data.length,
      activeSubscriptions: activeSubscriptions.data.length,
    };
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    throw error;
  }
}

export default {
  createOrGetStripeCustomer,
  createSubscriptionCheckout,
  createProductCheckout,
  cancelSubscription,
  reactivateSubscription,
  createPortalSession,
  handleWebhook,
  getSubscription,
  updateSubscription,
  createCoupon,
  validateCoupon,
  getCustomerPaymentMethods,
  createUsageRecord,
  getCustomerInvoices,
  retryFailedPayment,
  createSetupIntent,
  getSubscriptionAnalytics,
};