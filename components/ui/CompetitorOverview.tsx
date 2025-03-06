'use client'

import React, { useEffect, useState, useCallback, forwardRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/auth-helpers-nextjs';

interface CompetitorMetrics {
  total_keywords: number;
  average_keywords: number;
  total_opportunities: number;
  competitor_count: number;
  last_updated: string;
}

interface CompetitorOverviewProps {
  user: User;
  onRefreshRequest?: () => void;
}

const CompetitorOverview = forwardRef<{ refresh: () => Promise<void> }, CompetitorOverviewProps>(
  ({ user, onRefreshRequest }, ref) => {
    const [metrics, setMetrics] = useState<CompetitorMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    const fetchMetrics = useCallback(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_information')
        .select('competitor_metrics')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // console.error('Error fetching competitor metrics:', error);
        setLoading(false);
        return;
      }
      
      setMetrics(data.competitor_metrics);
      setLoading(false);
    }, [supabase, user.id]);

    React.useImperativeHandle(
      ref,
      () => ({
        refresh: fetchMetrics
      }),
      [fetchMetrics]
    );

    useEffect(() => {
      fetchMetrics();

      // Subscribe to changes
      const channel = supabase
        .channel('business_information_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'business_information',
            filter: `user_id=eq.${user?.id}`
          },
          (payload) => {
            setMetrics(payload.new.competitor_metrics);
            onRefreshRequest?.();
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }, [supabase, user.id, fetchMetrics, onRefreshRequest]);

    if (loading) {
      return (
        <div className="overflow-hidden bg-white sm:rounded-lg sm:shadow ring-slate-900/10 animate-pulse">
          <div className="h-48"></div>
        </div>
      );
    }

    if (!metrics) {
      return (
        <div className="overflow-hidden bg-white sm:rounded-lg sm:shadow ring-slate-900/10">
          <div className="p-6 text-center text-gray-500">
            No competitor metrics available
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white sm:rounded-lg sm:shadow ring-slate-900/10 basis-2/3">
        <div className='border-b border-gray-20'>
          <h2 className="text-base font-semibold leading-6 text-gray-900 p-6">
            Summary of {metrics?.competitor_count} competitors analyzed
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3 p-8 py-8">
          <div className="mx-auto flex max-w-xs flex-col">
            <dt className="text-base leading-7 text-gray-600">Total Keywords</dt>
            <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              {metrics?.total_keywords?.toLocaleString()}
            </dd>
          </div>
          <div className="mx-auto flex max-w-xs flex-col">
            <dt className="text-base leading-7 text-gray-600">Average Keywords per Competitor</dt>
            <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              {metrics?.average_keywords ? metrics?.average_keywords?.toLocaleString() : 0}
            </dd>
          </div>
          <div className="mx-auto flex max-w-xs flex-col">
            <dt className="text-base leading-7 text-gray-600">Total Opportunities</dt>
            <dd className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              <a href='/opportunities' className="text-indigo-600 hover:text-indigo-500">{metrics?.total_opportunities.toLocaleString()}</a>
            </dd>
          </div>
        </dl>
        <div className="text-xs text-gray-500 text-right p-4">
          Last updated: {new Date(metrics?.last_updated).toLocaleString()}
        </div>
      </div>
    );
  }
);

export default CompetitorOverview;

