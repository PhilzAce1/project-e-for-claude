'use client';

import { Tables } from '@/types_db';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import { User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;
interface ProductWithPrices extends Product {
  prices: Price[];
}

interface Props {
  user: User | null | undefined;
  products: ProductWithPrices[];
  subscription: any;
  keyword: string;
  search_volume?: number;
  competition?: string;
  main_intent?: string;
}

type BillingInterval = 'year' | 'month';

// Update the PRODUCT_ORDER array with correct IDs and add metadata
const PRODUCT_ORDER = [
  {
    id: 'prod_RkwMLCmqccX9RX',
    name: 'Basic',
    isPayAsYouGo: false,
    isRecommended: false
  },
  {
    id: 'prod_RkwNJpWtnsd8bY',
    name: 'Pro',
    isPayAsYouGo: false,
    isRecommended: true
  },
  {
    id: 'prod_RkwQcCmu6CEUfv',
    name: 'Enterprise',
    isPayAsYouGo: false,
    isRecommended: false
  }
];
const PRODUCT_ORDER_SECOND = [
  {
    id: 'prod_RJ6CHDZl8mv1QM',
    name: 'Growth Plan',
    isPayAsYouGo: false,
    isRecommended: false
  },
  {
    id: 'prod_RJ5FCKb73rXqQM',
    name: 'Pay As You Go',
    isPayAsYouGo: true,
    isRecommended: false
  }
]

export default function ContentPricing({ user, products, keyword, search_volume, competition, main_intent }: Props) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  // Update the sorting logic
  const sortedProducts = PRODUCT_ORDER
  .map(orderItem => {
    const product = products.find(p => p.id === orderItem.id);
    if (!product) return null;
    return {
      ...product,
      isPayAsYouGo: orderItem.isPayAsYouGo,
      isRecommended: orderItem.isRecommended
    };
  })
  .filter((p): p is (ProductWithPrices & { isPayAsYouGo: boolean; isRecommended: boolean }) => p !== undefined && p !== null);
  const sortedProductsSecond = PRODUCT_ORDER_SECOND
    .map(orderItem => {
      const product = products.find(p => p.id === orderItem.id);
      if (!product) return null;
      return {
        ...product,
        isPayAsYouGo: orderItem.isPayAsYouGo,
        isRecommended: orderItem.isRecommended
      };
    })
    .filter((p): p is (ProductWithPrices & { isPayAsYouGo: boolean; isRecommended: boolean }) => p !== undefined && p !== null);

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(undefined);
      return router.push('/signin/signup');
    }

    const priceWithMetadata = {
      ...price,
      metadata: {
        user_id: user.id,
        keyword: keyword,
        search_volume: search_volume,
        competition: competition,
        main_intent: main_intent
      }
    };

    const { errorRedirect, sessionId } = await checkoutWithStripe(
      priceWithMetadata,
      currentPath,
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

  if (!sortedProducts?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl font-semibold text-gray-900">
          No pricing plans available at the moment.
        </p>
      </div>
    );
  }

  const renderProduct = (product: ProductWithPrices & { isPayAsYouGo: boolean; isRecommended: boolean }) => {
      if (product.isPayAsYouGo) {
        return (
          <div className="col-start-2 justify-center">
          <div
            key={product.id}
            className="rounded-3xl p-8 ring-1 ring-gray-200 bg-white justify-center"
          >
            <h3 className="text-2xl font-bold text-gray-900">
              {product.name}
            </h3>
            <p className="mt-4 text-sm text-gray-600">
              {product.description}
            </p>
            <p className="mt-6 flex items-baseline gap-x-1 text-gray-900">
              <span className="text-4xl font-bold">{new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: product.prices[0].currency!,
        minimumFractionDigits: 0
      }).format((product.prices[0].unit_amount || 0) / 100)}</span>
              <span className="text-sm font-semibold">
                /per piece of content
              </span>
            </p>
            <ul role="list" className="mt-8 space-y-3 text-sm text-gray-600">
              {product.features?.map((feature) => (
                <li key={feature.name} className="flex gap-x-3">
                  <CheckIcon 
                    className="h-6 w-5 flex-none text-indigo-600" 
                    aria-hidden="true" 
                  />
                  {feature.name}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleStripeCheckout(product.prices[0])}
              disabled={priceIdLoading === product.prices[0]?.id}
              className="mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {priceIdLoading === product.prices[0]?.id ? 'Loading...' : 'Pay for Content'}
            </button>
          </div>
          </div>
        );
      }

      // Regular subscription products
      const price = product?.prices?.find(
        (price) => price.interval === billingInterval
      );
      if (!price) return null;

      const priceString = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currency!,
        minimumFractionDigits: 0
      }).format((price?.unit_amount || 0) / 100);

      const isPopular = product.name === 'Pro';

      return (
        <div
          key={product.id}
          className={`rounded-3xl p-8 ring-1 ${
            product.isRecommended 
              ? 'ring-2 ring-indigo-600 bg-white' 
              : 'ring-gray-200 bg-white'
          } relative`}
        >
          {product.isRecommended && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white ring-1 ring-inset ring-indigo-600/20">
                Recommended
              </span>
            </div>
          )}
          <h3 
            className={`text-2xl font-bold ${
              isPopular ? 'text-white' : 'text-gray-900'
            }`}
          >
            {product.name}
          </h3>
          
          {isPopular && (
            <p className="mt-4 text-sm text-white">
              <span className="bg-indigo-600 px-3 py-1 rounded-full text-white text-xs font-semibold">
                Most popular
              </span>
            </p>
          )}

          {/* <p className={`mt-4 text-sm ${
            isPopular ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {product.description}
          </p> */}

          <p className={`mt-6 flex items-baseline gap-x-1 ${
            isPopular ? 'text-white' : 'text-gray-900'
          }`}>
            <span className="text-4xl font-bold">{priceString}</span>
            <span className="text-sm font-semibold">
              /{billingInterval}
            </span>
          </p>

          <ul role="list" className={`mt-8 space-y-3 text-sm ${
            isPopular ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {product.features?.map((feature) => (
              <li key={feature.name} className="flex gap-x-3">
                <CheckIcon 
                  className={`h-6 w-5 flex-none ${
                    isPopular ? 'text-white' : 'text-indigo-600'
                  }`} 
                  aria-hidden="true" 
                />
                {feature.name}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleStripeCheckout(price)}
            disabled={priceIdLoading === price.id}
            className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm ${
              isPopular
                ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {priceIdLoading === price.id ? 'Loading...' : 'Choose Plan'}
          </button>
        </div>
      );
    
  }

  return (
    <div className="bg-white py-8 sm:py-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Content Creation</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose your content plan
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600 sm:text-3xl">
            Chosen keyword: {keyword}
          </p>
        </div>
        
        <div className="mt-16 flex justify-center">
          <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200">
            <button
              onClick={() => setBillingInterval('month')}
              className={`rounded-full px-4 py-2 ${
                billingInterval === 'month' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={`rounded-full px-4 py-2 ${
                billingInterval === 'year' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Annual billing
              <span className={`ml- ${billingInterval === 'year' ? 'text-white' : 'text-indigo-600'}`}>(-20%)</span>
            </button>
          </div>
        </div>

        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {sortedProducts.map((product) => renderProduct(product))}
        </div>



        <h2 className="text-2xl font-bold text-gray-900 text-center mt-16 mb-6">Or</h2>
        <div className="isolate mx-auto mt-10 max-w-md  gap-8 lg:mx-0 lg:max-w-none flex justify-center">
          {sortedProductsSecond.map((product) => renderProduct(product))}
        </div>
      </div>
    </div>
  );
} 