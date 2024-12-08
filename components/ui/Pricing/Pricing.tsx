'use client';

import LogoCloud from '@/components/ui/LogoCloud';
import type { Tables } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

type Subscription = Tables<'subscriptions'>;
type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}
interface PriceWithProduct extends Price {
  products: Product | null;
}
interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null;
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: SubscriptionWithProduct | null;
}

type BillingInterval = 'lifetime' | 'year' | 'month';

export default function Pricing({ user, products, subscription }: Props) {
  const intervals = Array.from(
    new Set(
      products?.flatMap((product) =>
        product?.prices?.map((price) => price?.interval)
      )
    )
  );
  const router = useRouter();
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/signin/signup');
    }

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      price,
      currentPath
    );

    if (errorRedirect) {
      setPriceIdLoading(undefined);
      return router.push(errorRedirect);
    }

    if (!sessionId) {
      setPriceIdLoading(undefined);
      return router.push(
        getErrorRedirect(
          currentPath,
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }

    const stripe = await getStripe();
    stripe?.redirectToCheckout({ sessionId });

    setPriceIdLoading(undefined);
  };


  if (!products?.length) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
        <LogoCloud />
      </section>
    );
  } else {
    return (
      <>
      {products.map((product) => {
              const price = product?.prices?.find(
                (price) => price.interval === billingInterval
              );
              if (!price) return null;
              const priceString = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: price.currency!,
                minimumFractionDigits: 0
              }).format((price?.unit_amount || 0) / 100);
              return (
                <div className="mx-auto mt-8 max-w-2xl rounded-3xl ring-1 ring-gray-200 lg:mx-0 lg:flex lg:max-w-none">
              <div className="p-8 sm:p-10 lg:flex-auto">
                <h3 className="text-3xl font-semibold tracking-tight text-gray-900">
                {product.name}</h3>
                <p className="mt-6 text-base/7 text-gray-600">
                  {product.description}
                </p>
                <div className="mt-10 flex items-center gap-x-4">
                  <h4 className="flex-none text-sm/6 font-semibold text-indigo-600">What’s included</h4>
                  <div className="h-px flex-auto bg-gray-100" />
                </div>
                <ul role="list" className="mt-8 grid grid-cols-1 gap-4 text-sm/6 text-gray-600 sm:grid-cols-2 sm:gap-6">
                  {product.features?.map((feature) => (
                    <li key={feature.name} className="flex gap-x-3">
                      <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-600" />
                      {feature.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:shrink-0">
                <div className="rounded-2xl bg-gray-50 pb-10 pt-5 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                  <div className="mx-auto max-w-xs px-8">
                    <div className="mb-8 flex justify-center">
                      <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs/5 font-semibold ring-1 ring-inset ring-gray-200">
                        {intervals.includes('month') && (
                          <button
                            onClick={() => setBillingInterval('month')}
                            type="button"
                            className={`${
                              billingInterval === 'month'
                                ? ' text-white bg-indigo-600'
                                : ' text-gray-500 '
                            } relative cursor-pointer rounded-full px-2.5 py-1`}
                          >
                            Monthly
                          </button>
                        )}
                        {intervals.includes('year') && (
                          <button
                            onClick={() => setBillingInterval('year')}
                            type="button"
                            className={`${
                              billingInterval === 'year'
                                ? ' text-white bg-indigo-600'
                                : ' text-gray-500 '
                            } relative cursor-pointer rounded-full px-2.5 py-1`}
                          >
                            Yearly
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-6 flex items-baseline justify-center gap-x-2">
                      <span className="text-5xl font-semibold tracking-tight text-gray-900">{priceString}</span>
                      <span className="text-sm/6 font-semibold tracking-wide text-gray-600">GBP</span>
                    </p>
                    <button
                      onClick={() => handleStripeCheckout(price)}
                      className="mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Get access
                    </button>
                    <p className="mt-6 text-xs/5 text-gray-600">
                      Invoices and receipts available for easy company reimbursement
                    </p>
                  </div>
                </div>
              </div>
            </div>
              )})}
      </>
    );
  }
}
