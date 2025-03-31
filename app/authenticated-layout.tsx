'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import { Bars3Icon } from '@heroicons/react/24/outline';
import Logo from '@/components/icons/Logo';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { handleCountrySelect } from '@/utils/supabase/country';
import posthog from 'posthog-js';
import { useRouter, usePathname } from 'next/navigation';
import ZeroStateHero from '@/components/ZeroStateHero';
import TrialCountdown from '@/components/ui/TrialCountdown';
import { WebsiteProvider } from '@/contexts/WebsiteContext';

export default function AuthenticatedLayout({
  children,
  user,
  products,
  subscription,
  disableZeroStateForm = false
}: {
  children: React.ReactNode;
  user: any;
  products: any;
  subscription: any;
  disableZeroStateForm?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [currentCountry, setCurrentCountry] = useState<string>('GB');
  const [domain, setDomain] = useState('')
  const [existingDomain, setExistingDomain] = useState(false)
  const supabase = createClientComponentClient();
  
  // Check if user has the base plan
  const hasPlan = subscription.length > 0;

  if (user) {
    posthog.identify(
      user.id, // Required. Replace 'distinct_id' with your user's unique identifier
      { email: user?.email, name: user?.metadata?.full_name || user?.metadata?.email },  // $set, optional
    )
  }

  useEffect(() => {
    const checkCountrySettings = async () => {
      const { data, error } = await supabase
        .from('business_information')
        .select('target_country')
        .eq('id', user?.user_metadata?.selected_business_id)
        .single();

      // if (error) {
      //   // console.error('Error checking country settings:', error);
      // }

      if (data?.target_country) {
        setCurrentCountry(data.target_country);
      }

      if (!data?.target_country) {
        setShowCountrySelector(true);
      } else {
        setShowCountrySelector(false);
      }
    };

    checkCountrySettings();
  }, [user.id, supabase]);


  const handleCountryUpdate = async (country: string) => {
    await handleCountrySelect(user.id, country, () => setShowCountrySelector(false));
  };
  const checkExistingDomain = useCallback(async () => {
      try {
          const { data, error } = await supabase
              .from('business_information')
              .select('domain')
              .eq('id', user?.user_metadata?.selected_business_id)
              .single()

          if (error) throw error

          if (data) {
              setExistingDomain(data.domain)
          }
      } catch (error) {
          // console.error('Error checking existing domain:', error)
      }
  }, [supabase, user.id]);

  useEffect(() => {
      checkExistingDomain();
  }, [checkExistingDomain]);


  return (
    <WebsiteProvider>
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
              {!hasPlan && <TrialCountdown user={user} />}
              <div className="px-4 sm:px-6 lg:px-8 h-full">

              {(!existingDomain && !domain) && !disableZeroStateForm ? (
                  <ZeroStateHero 
                      title="Kickstart Your SEO Strategy Now!"
                      subtitle="We need to start by learning about your business."
                      description="Enter your domain below to begin."
                      ctaText="Start Now"
                      user={user}
                      imageSrc="/rank-image.webp"
                      fullPage={true}
                      domainHandler={setDomain}
                  />
              ) :
                children
              }
              </div>
            </main>
          </div>
        </div>
    </WebsiteProvider>
  );
}