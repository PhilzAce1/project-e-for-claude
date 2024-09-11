'use client';

import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmailForm({
  userEmail
}: {
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (e.currentTarget.newEmail.value === userEmail) {
      setIsSubmitting(false);
      return;
    }
    await handleRequest(e, updateEmail, router);
    setIsSubmitting(false);
  };

  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
      <div>
        <h2 className="text-base font-semibold leading-7 text-gray-900">Email Address</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Update your email address. We will email you to verify the change.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="md:col-span-2">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:max-w-xl sm:grid-cols-6">
          <div className="col-span-full">
            <label htmlFor="newEmail" className="block text-sm font-medium leading-6 text-gray-900">
              New Email
            </label>
            <div className="mt-2">
              <input
                type="email"
                name="newEmail"
                id="newEmail"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                defaultValue={userEmail ?? ''}
                placeholder="Your email"
                maxLength={64}
              />
            </div>
          </div>
        </div>
        <div className="mt-8 flex">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {isSubmitting ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      </form>
    </div>
  );
}
