'use client'

import { useRouter } from 'next/navigation';
import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import Pricing from './Pricing';

interface PaymentRequiredProps {
  user: User;
  products: any;
  subscription: any;
  children: React.ReactNode;
}

export default function PaymentRequired({ user, children, products, subscription }: PaymentRequiredProps) {
  const [loading, setLoading] = useState(true);
  const [needsPayment, setNeedsPayment] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkPaymentStatus() {
      try {
        // Check if user has completed analysis and competitors
        const [{ data: analysisData }, { data: competitorsData }] = await Promise.all([
          supabase
            .from('business_analyses')
            .select('completion_status')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('competitors')
            .select('id')
            .eq('user_id', user.id)
        ]);
        console.log('analysisData', analysisData)

        const hasCompletedAnalysis = analysisData?.completion_status;
        const hasCompetitors = competitorsData && competitorsData.length > 0;

        // Check subscription status
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('status, stripe_subscription_id')
          .eq('user_id', user.id)
          .single();

        const hasActiveSubscription = subscriptionData?.status === 'active';

        // Set payment required if analysis is complete, has competitors, but no subscription
        console.log(hasCompletedAnalysis, hasCompetitors, !hasActiveSubscription)
        setNeedsPayment(hasCompletedAnalysis && hasCompetitors && !hasActiveSubscription);
        setLoading(false);
      } catch (error) {
        console.error('Error checking payment status:', error);
        setLoading(false);
      }
    }

    checkPaymentStatus();
  }, [user.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (needsPayment) {
    return (
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl sm:text-center">
              <h2 className="text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-balance sm:text-6xl">
                Simple no-tricks pricing
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
                Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi velit ut non voluptas
                in. Explicabo id ut laborum.
              </p>
            </div>
            
            <Pricing user={user} products={products} subscription={subscription} />
          </div>

      </div>
    );
  }

  return children;
}
