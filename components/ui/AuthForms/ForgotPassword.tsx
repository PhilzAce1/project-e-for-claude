'use client';

import Link from 'next/link';
import { requestPasswordUpdate } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Define prop type with allowEmail boolean
interface ForgotPasswordProps {
  allowEmail: boolean;
  redirectMethod: string;
  disableButton?: boolean;
}

export default function ForgotPassword({
  allowEmail,
  redirectMethod,
  disableButton
}: ForgotPasswordProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    await handleRequest(e, requestPasswordUpdate, router);
    setIsSubmitting(false);
  };

  return (
    <form className="space-y-6" onSubmit={(e) => handleSubmit(e)}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="flex w-full justify-center rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          disabled={isSubmitting || disableButton}
        >
          {isSubmitting ? 'Sending...' : 'Send reset email'}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-sm text-gray-500">
          <Link href="/signin/password_signin" className="font-semibold text-orange-600 hover:text-orange-500">
            Sign in 
          </Link>
        </p>
        <p className="text-sm text-gray-500">
          <Link href="/signin/signup" className="font-semibold text-orange-600 hover:text-orange-500">
            Don't have an account? Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
