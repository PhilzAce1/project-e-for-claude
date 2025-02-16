'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PaymentCompleteContentProps {
  user: any;
}

export default function PaymentCompleteContent({ user }: PaymentCompleteContentProps) {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center pt-16 pb-24">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase. Your payment has been processed successfully.
          </p>
          <div className="flex gap-4">
            <Link
              href="/opportunities"
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Create New Content
            </Link>
            <Link
              href="/content-orders"
              className="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
            >
              View Your Content Orders
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 