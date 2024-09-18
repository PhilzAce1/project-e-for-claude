'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ConfirmEmailContent() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || null);
      } else {
        // If no user is found, we'll keep the generic message
        setEmail(null);
      }
    };

    getUser();
  }, [supabase]);

  return (
    <div className="text-center">
      <p className="text-lg text-gray-700 mb-4">
        We've sent a confirmation email to:
      </p>
      <p className="text-xl font-semibold text-gray-900 mb-6">
        {email || 'your email address'}
      </p>
      <p className="text-gray-600 mb-8">
        Please check your inbox and click on the confirmation link to verify your email address.
      </p>
      <button
        onClick={() => router.push('/')}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
      >
        Return to Home Page
      </button>
    </div>
  );
}
