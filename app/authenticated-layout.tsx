'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Logo from '@/components/icons/Logo';
import PaymentRequired from '@/components/ui/Pricing/PaymentRequired';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { handleCountrySelect } from '@/utils/supabase/country';

export default function AuthenticatedLayout({
  children,
  user,
  products,
  subscription,
  disableGateway = false
}: {
  children: React.ReactNode;
  user: any;
  products: any;
  subscription: any; 
  disableGateway?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<string>('GB');
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    const checkCountrySettings = async () => {
      const { data, error } = await supabase
        .from('business_information')
        .select('target_country')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking country settings:', error);
      }

      if (data?.target_country) {
        setCurrentCountry(data.target_country);
      }

      if (!data?.target_country) {
        setShowCountrySelector(true);
      }
    };

    checkCountrySettings();
  }, [user.id, supabase]);

  const handleCountryUpdate = async (country: string) => {
    await handleCountrySelect(user.id, country, () => setShowCountrySelector(false));
  };

  return (
    <div className="min-h-screen h-screen bg-gray-100">
      <CountrySelector 
        isOpen={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSubmit={handleCountryUpdate}
        initialCountry={currentCountry}
      />
      
      <Sidebar 
        user={user} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />

      <div className="lg:pl-72 h-full">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <button 
            type="button" 
            className="-m-2.5 p-2.5 text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex-1 flex justify-center lg:justify-end">
                <Logo className="h-8 w-auto" />
              </div>
            </div>
          </div>
        </div>

        <main className="py-4 sm:py-6 lg:py-10 h-full fixed lg:relative top-0 overflow-auto w-full lg:w-auto">
          <div className="px-4 sm:px-6 lg:px-8 h-full">
            {!disableGateway ? (<PaymentRequired user={user} products={products} subscription={subscription}>{children}</PaymentRequired>) : children}
          </div>
        </main>
      </div>
    </div>
  );
}