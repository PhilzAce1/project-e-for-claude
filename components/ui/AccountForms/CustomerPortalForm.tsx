'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { createStripePortal } from '@/utils/stripe/server';
import Link from 'next/link';
import { Tables } from '@/types_db';

type Subscription = Tables<'subscriptions'>;
type Price = Tables<'prices'>;
type Product = Tables<'products'>;

type SubscriptionWithPriceAndProduct = Subscription & {
  prices:
    | (Price & {
        products: Product | null;
      })
    | null;
};

interface Props {
  subscription: SubscriptionWithPriceAndProduct | null;
}

export default function CustomerPortalForm({ subscription }: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subscriptionPrice =
    subscription &&
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: subscription?.prices?.currency!,
      minimumFractionDigits: 0
    }).format((subscription?.prices?.unit_amount || 0) / 100);

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    try {
      const redirectUrl = await createStripePortal(currentPath);
      router.push(redirectUrl);
    } catch (error) {
      console.error('Failed to create Stripe portal session:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">Plan Information</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          View and manage your subscription details.
        </p>
      </div>

      <form className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <div className="col-span-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Your Plan</h3>
            <p className="mt-1 text-sm text-gray-500">
              {subscription
                ? `You are currently on the ${subscription?.prices?.products?.name} plan.`
                : 'You are not currently subscribed to any plan.'}
            </p>
          </div>

          <div className="col-span-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Price</h3>
            <p className="mt-1 text-sm text-gray-500">
              {subscription ? (
                `${subscriptionPrice}/${subscription?.prices?.interval}`
              ) : (
                <Link href="/" className="text-orange-600 hover:text-orange-500">
                  Choose your plan
                </Link>
              )}
            </p>
          </div>

          <div className="col-span-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Subscription</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your subscription on Stripe.
            </p>
            <div className="mt-6">
              <button
                onClick={handleStripePortalRequest}
                disabled={isSubmitting}
                className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {isSubmitting ? 'Loading...' : 'Open customer portal'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
