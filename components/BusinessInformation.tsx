'use client'
import React, { useEffect, useState } from 'react';
import { BusinessAnalysisData } from '../../types';
import ConfidenceIndicator from './ConfidenceIndicators';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

interface BusinessAnalysisProps {
  analysisId: string;
}

export const BusinessAnalysis: React.FC<BusinessAnalysisProps> = ({ analysisId }) => {
  const [data, setData] = useState<BusinessAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Initializing...');
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Initial fetch of analysis data
    const fetchAnalysis = async () => {
      const { data: analysis, error } = await supabase
        .from('business_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (analysis) {
        setData(analysis);
        setProgress(analysis.progress || 'Loading...');
        setLoading(analysis.status === 'pending' || analysis.status === 'processing');
      }
    };

    fetchAnalysis();

    // Set up real-time subscription
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_analyses',
          filter: `id=eq.${analysisId}`
        },
        (payload: any) => {
          console.log('Received update:', payload);
          const analysis = payload.new;
          setData(analysis);
          setProgress(analysis.progress || 'Loading...');
          setLoading(analysis.status === 'pending' || analysis.status === 'processing');
          
          if (analysis.status === 'failed') {
            setError(analysis.error_message || 'Analysis failed');
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [analysisId, supabase]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="text-sm text-gray-500">{progress}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">No analysis data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Business Analysis
        </h1>
        <div className="text-sm text-gray-500">{progress}</div>
      </div>

      {/* Core Business Overview */}
      <div className="mt-5 overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Core Business Summary</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Products & Services */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Products & Services</h3>
              <ul className="mt-3 divide-y divide-gray-200">
                {data.initial_findings.coreBusiness.offerings.products?.map(product => (
                  <li key={product} className="py-3">{product}</li>
                ))}
                {data.initial_findings.coreBusiness.offerings.services?.map(service => (
                  <li key={service} className="py-3">{service}</li>
                ))}
              </ul>
              <ConfidenceIndicator score={data.initial_findings.coreBusiness.confidenceScores.offerings} />
            </div>

            {/* Target Customer */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Target Customer</h3>
              <div className="mt-3">
                <h4 className="text-sm text-gray-700">Demographics:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {data.initial_findings.coreBusiness.targetCustomer.demographics.map(demo => (
                    <li key={demo} className="py-3">{demo}</li>
                  ))}
                </ul>
                <h4 className="mt-4 text-sm text-gray-700">Psychographics:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {data.initial_findings.coreBusiness.targetCustomer.psychographics.map(psycho => (
                    <li key={psycho} className="py-3">{psycho}</li>
                  ))}
                </ul>
                <ConfidenceIndicator score={data.initial_findings.coreBusiness.confidenceScores.targetCustomer} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Position & Customer Journey */}
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Market Position */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Market Position</h2>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Unique Factors</h3>
              <ul className="mt-3 divide-y divide-gray-200">
                {data.initial_findings.marketPosition.uniqueFactors.map(factor => (
                  <li key={factor} className="py-3">{factor}</li>
                ))}
              </ul>
              <ConfidenceIndicator score={data.initial_findings.marketPosition.confidenceScores.uniqueFactors} />
            </div>
          </div>
        </div>

        {/* Customer Journey */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900">Customer Journey</h2>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Common Questions</h3>
              <div className="mt-3">
                <h4 className="text-sm text-gray-700">Explicit:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {data.initial_findings.customerJourney.commonQuestions.explicit.map(question => (
                    <li key={question} className="py-3">{question}</li>
                  ))}
                </ul>
                <h4 className="mt-4 text-sm text-gray-700">Implicit:</h4>
                <ul className="mt-2 divide-y divide-gray-200">
                  {data.initial_findings.customerJourney.commonQuestions.implicit.map(question => (
                    <li key={question} className="py-3">{question}</li>
                  ))}
                </ul>
                <ConfidenceIndicator score={data.initial_findings.customerJourney.confidenceScores.commonQuestions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-5 overflow-hidden rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Required Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Critical Information */}
            <div>
              <h3 className="text-sm font-medium text-red-500">Critical Information Needed</h3>
              <ul className="mt-3 divide-y divide-gray-200">
                {data.information_needed.critical.map(item => (
                  <li key={item.question} className="py-3 text-red-600">
                    {item.question}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Information */}
            <div>
              <h3 className="text-sm font-medium text-amber-500">Recommended Information</h3>
              <ul className="mt-3 divide-y divide-gray-200">
                {data.information_needed.recommended.map(item => (
                  <li key={item.question} className="py-3 text-amber-600">
                    {item.question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
