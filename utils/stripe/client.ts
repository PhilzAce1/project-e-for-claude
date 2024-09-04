import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
        ''
    );
  }

  return stripePromise;
};

export async function createStripePortal(currentPath: string) {
  const res = await fetch('/api/create-stripe-portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ currentPath }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to create Stripe portal session');
  }

  const data = await res.json();
  return data.url;
}
