'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { User } from '@supabase/supabase-js';
import { redirect, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const CustomerPortalForm = dynamic(
  () => import('@/components/ui/AccountForms/CustomerPortalForm'),
  { ssr: false }
);

const EmailForm = dynamic(
  () => import('@/components/ui/AccountForms/EmailForm'),
  { ssr: false }
);

const NameForm = dynamic(
  () => import('@/components/ui/AccountForms/NameForm'),
  { ssr: false }
);

export default function AccountContent({ user, userDetails, subscription }: {
  user: User; // Replace 'User' with the actual type of your user object
  userDetails: any; // Replace 'any' with the actual type of userDetails
  subscription: any; // Replace 'any' with the actual type of subscription
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <section className="mb-32">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10">
        <div className="min-w-0 flex-1 p-8">
          <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Account
          </h1>
          <p className="mt-5 text-xl text-zinc-700 sm:text-2xl">
            Manage your subscription and account details.
          </p>
        </div>
        <div className="p-8">
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8 py-16 mt-8">
        {/* <CustomerPortalForm subscription={subscription} />
        
        <div className="border-t border-gray-200 my-16" aria-hidden="true" /> */}
        
        <NameForm userName={user?.user_metadata?.full_name ?? ''} />
        
        <div className="border-t border-gray-200 my-16" aria-hidden="true" />
        
        <EmailForm userEmail={user.email} />
      </div>
    </section>
  );
}
