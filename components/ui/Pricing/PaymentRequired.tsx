'use client'

import { useRouter } from 'next/navigation';
import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import Pricing from './Pricing';
import { Tables } from '@/types_db';
import { calculateTotalIssues } from '../SEOIssuesList';
import { fetchContentRecommendations } from '@/utils/helpers/content-recommendations';
import { useWebsite } from '@/contexts/WebsiteContext';

interface PaymentRequiredProps {
  user: User;
  products: any;
  subscription: any;
  children: React.ReactNode;
}

interface CompetitorMetrics {
  total_keywords: number;
  average_keywords: number;
  total_opportunities: number;
  competitor_count: number;
  last_updated: string;
}

export default function PaymentRequired({ user, children, products, subscription }: PaymentRequiredProps) {
  const [loading, setLoading] = useState(true);
  const [needsPayment, setNeedsPayment] = useState(false);
  const [metrics, setMetrics] = useState<CompetitorMetrics | null>(null);
  const [totalSEOIssues, setTotalSEOIssues] = useState<number>(0);
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const supabase = createClientComponentClient();
  type Product = Tables<'products'>;
  const { currentWebsite } = useWebsite();

  useEffect(() => {
    async function checkPaymentStatus() {
      try {
        const [{ data: analysisData }, { data: businessInfo }, { data: seoData }, { data: rankingsData }] = await Promise.all([
          supabase
            .from('business_analyses')
            .select('completion_status')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('business_information')
            .select('competitor_metrics')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('seo_crawls')
            .select('page_metrics')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('business_information')
            .select('rankings_data')
            .eq('user_id', user.id)
            .single()
        ]);

        const hasCompletedAnalysis = analysisData?.completion_status;
        const hasCompetitors = businessInfo?.competitor_metrics?.competitor_count > 0;

        // Calculate total SEO issues if we have data
        if (seoData?.page_metrics) {
          const issues = calculateTotalIssues(seoData.page_metrics);
          setTotalSEOIssues(issues);
        }

        // Set metrics if available
        if (businessInfo?.competitor_metrics) {
          setMetrics(businessInfo.competitor_metrics);
        }

        // Fetch content recommendations
        const recommendations = await fetchContentRecommendations(currentWebsite?.id);
        setRecommendationData(recommendations);
        const hasActiveSubscription = subscription.filter((sub: { status: string; prices: { product_id: string; }; }) => (sub?.status === 'active' || sub?.status === 'trialing')).length > 0;
                // Set payment required if analysis is complete, has competitors, but no subscription
        setNeedsPayment(!hasActiveSubscription);
        setLoading(false);
      } catch (error) {
        // console.error('Error checking payment status:', error);
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
      <div className="bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl sm:text-center">
            <h2 className=" mt-8 text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-balance sm:text-6xl">
              Simple no-tricks pricing
            </h2>
            <h3 className="text-gray-600 text-2xl">7 Day Free Trial</h3>
          </div>
          {metrics && (
            <div className="bg-white rounded-2xl ring-1 ring-inset ring-gray-900/5 shadow mt-6">
              <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3 p-8 py-8 border-b border-gray-200">
                <div className="mx-auto flex max-w-xs flex-col">
                  <dt className="text-base leading-7 text-gray-600">Total Keyword Opportunities</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    {recommendationData.length > 0 ? recommendationData.length : '20+'}
                  </dd>
                </div>
                <div className="mx-auto flex max-w-xs flex-col">
                  <dt className="text-base leading-7 text-gray-600">Total Competitor Keywords Found</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    {metrics.total_keywords.toLocaleString()}
                  </dd>
                </div>
                <div className="mx-auto flex max-w-xs flex-col">
                  <dt className="text-base leading-7 text-gray-600">Competitors Analyzed</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    {metrics.competitor_count}
                  </dd>
                </div>
                </dl>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-2 p-8 py-8">
                <div className="mx-auto flex max-w-xs flex-col">
                  <dt className="text-base leading-7 text-gray-600">Articles to implement now</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    20+
                  </dd>
                </div>
                <div className="mx-auto flex max-w-xs flex-col">
                  <dt className="text-base leading-7 text-gray-600">OnPage SEO improvements</dt>
                  <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                    {totalSEOIssues}
                  </dd>
                </div>
              </dl>
            </div>
          )}
          
          <Pricing user={user} products={products.filter((product: Product) => product.name === 'Base Plan')} subscription={subscription} />
          
        </div>
      </div>
    );
  }

  return children;
}
