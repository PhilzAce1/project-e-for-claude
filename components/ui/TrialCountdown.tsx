'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function TrialCountdown({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const calculateDaysLeft = async () => {
      try {
        const createdAt = new Date(user.created_at);
        const trialEndDate = new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
        const now = new Date();
        const timeLeft = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        setDaysLeft(Math.max(0, daysRemaining));
      } catch (error) {
        console.error('Error calculating trial days:', error);
      }
    };

    calculateDaysLeft();
  }, [user.created_at]);

  if (dismissed || daysLeft === null || daysLeft > 7) return null;

  return (
    <div className="bg-indigo-600 -mt-10 mb-8">
      <div className="mx-auto max-w-7xl py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex w-0 flex-1 items-center">
            <span className="flex rounded-lg bg-indigo-800 p-2">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="ml-3 truncate font-medium text-white">
              <span className="md:hidden">
                {daysLeft} days left in trial!
              </span>
              <span className="hidden md:inline">
                {daysLeft} days left of your Free Trial. Subscribe now to not lose your data.
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 w-full flex-shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
            <button
              onClick={() => router.push('/content-pricing')}
              className="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
            >
              Subscribe now
            </button>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="-mr-1 flex rounded-md p-2 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 