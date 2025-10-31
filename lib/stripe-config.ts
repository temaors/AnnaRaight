import Stripe from 'stripe';

// Initialize Stripe with API key (only if key is provided)
export const stripe = process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('51234567890') 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    })
  : null;

// Stripe configuration
export const stripeConfig = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  currency: 'usd',
  successUrl: process.env.NEXT_PUBLIC_BASE_URL + '/payment/success?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: process.env.NEXT_PUBLIC_BASE_URL + '/payment/cancelled',
};

// Validate required environment variables
export function validateStripeConfig() {
  const required = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(', ')}`);
  }
}

// Helper to create checkout session
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail: string;
  lineItems: Array<{
    price?: string;
    price_data?: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}) {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured. Please add valid Stripe keys to .env.local' };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      customer_email: params.customerEmail,
      payment_method_types: ['card'],
      line_items: params.lineItems,
      mode: 'payment',
      success_url: params.successUrl || stripeConfig.successUrl,
      cancel_url: params.cancelUrl || stripeConfig.cancelUrl,
      metadata: params.metadata || {},
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI'],
      },
    });

    return { success: true, session };
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper to retrieve checkout session
export async function retrieveCheckoutSession(sessionId: string) {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });
    return { success: true, session };
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper to create payment intent
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || stripeConfig.currency,
      customer: params.customerId,
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return { success: true, paymentIntent };
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Helper to create or retrieve customer
export async function createOrRetrieveCustomer(email: string, name?: string) {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    // First try to find existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return { success: true, customer: existingCustomers.data[0] };
    }

    // Create new customer if not found
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });

    return { success: true, customer };
  } catch (error) {
    console.error('Customer creation/retrieval failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}