'use client'
import React, { useEffect, useState } from 'react';
import { BusinessAnalysisData } from '../../types';
import ConfidenceIndicator from './ConfidenceIndicators';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import BusinessProgress from './ui/BusinessProgress';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface BusinessAnalysisProps {
  analysisId: string;
}

interface VerificationFormProps {
  questions: any[];
  onSubmit: (updatedQuestions: any[]) => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({ questions, onSubmit }) => {
  const [formData, setFormData] = useState(questions);

  const handleAddItem = (questionIndex: number, key?: string) => {
    const updatedData = [...formData];
    const question = updatedData[questionIndex];

    if (question.currentValue.type === 'list') {
      question.currentValue.items.push('');
    } else if (question.currentValue.type === 'object' && key) {
      const itemIndex = question.currentValue.items.findIndex((item: any) => item.key === key);
      if (itemIndex !== -1) {
        question.currentValue.items[itemIndex].value.push('');
      }
    }

    setFormData(updatedData);
  };

  const handleRemoveItem = (questionIndex: number, itemIndex: number, key?: string) => {
    const updatedData = [...formData];
    const question = updatedData[questionIndex];

    if (question.currentValue.type === 'list') {
      question.currentValue.items.splice(itemIndex, 1);
    } else if (question.currentValue.type === 'object' && key) {
      const objIndex = question.currentValue.items.findIndex((item: any) => item.key === key);
      if (objIndex !== -1) {
        question.currentValue.items[objIndex].value.splice(itemIndex, 1);
      }
    }

    setFormData(updatedData);
  };

  const handleUpdateItem = (questionIndex: number, itemIndex: number, value: string, key?: string) => {
    const updatedData = [...formData];
    const question = updatedData[questionIndex];

    if (question.currentValue.type === 'list') {
      question.currentValue.items[itemIndex] = value;
    } else if (question.currentValue.type === 'object' && key) {
      const objIndex = question.currentValue.items.findIndex((item: any) => item.key === key);
      if (objIndex !== -1) {
        question.currentValue.items[objIndex].value[itemIndex] = value;
      }
    }

    setFormData(updatedData);
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      {formData.map((question, questionIndex) => (
        <div key={questionIndex} className="mb-8 border-b border-white/10 pb-8">
          <h3 className="text-balance text-xl font-semibold tracking-tight text-white sm:text-xl mb-4">
            {question.question}
          </h3>

          {question.currentValue.type === 'list' && (
            <div className="space-y-2">
              {question.currentValue.items.map((item: string, itemIndex: number) => (
                <div key={itemIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateItem(questionIndex, itemIndex, e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(questionIndex, itemIndex)}
                    className="rounded-md bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem(questionIndex)}
                className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" /> Add Item
              </button>
            </div>
          )}

          {question.currentValue.type === 'object' && (
            <div className="space-y-4">
              {question.currentValue.items.map((item: any) => (
                <div key={item.key} className="space-y-2">
                  <h4 className="text-balance text-l font-semibold tracking-tight text-white sm:text-l mb-2">
                    {item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  {item.value.map((value: string, valueIndex: number) => (
                    <div key={valueIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleUpdateItem(questionIndex, valueIndex, e.target.value, item.key)}
                        className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(questionIndex, valueIndex, item.key)}
                        className="rounded-md bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddItem(questionIndex, item.key)}
                    className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                  >
                    <PlusIcon className="h-4 w-4" /> Add {item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

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

  const handleVerificationSubmit = async (updatedQuestions: any[]) => {
    try {
      const { error } = await supabase
        .from('business_analyses')
        .update({
          verification_questions: updatedQuestions,
          status: 'completed'
        })
        .eq('id', analysisId);

      if (error) throw error;
      
      // Show success message
    } catch (error) {
      console.error('Error updating verification questions:', error);
      // Show error message
    }
  };

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
      <div className="grid grid-cols-3 gap-4">
        <div className="mt-5 col-span-2 relative isolate overflow-hidden bg-gray-900 px-6 py-16 text-center shadow-2xl sm:rounded-xl sm:px-8">
            <div className="border-b border-white/10 pb-8 mb-8">
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Confirm your business information
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-300">
                To create a personalised SEO strategy, we need to know more about your business. We tried to find out as much as we could, but we need you to confirm a few things.
            </p>
            </div>

            <VerificationForm 
              questions={data.verification_questions} 
              onSubmit={handleVerificationSubmit} 
            />

            <svg
                viewBox="0 0 1024 1024"
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            >
                <circle r={512} cx={512} cy={512} fill="url(#827591b1-ce8c-4110-b064-fff)" fillOpacity="0.7" />
                <defs>
                <radialGradient id="827591b1-ce8c-4110-b064-fff">
                    <stop stopColor="#7775D6" />
                    <stop offset={1} stopColor="#DDEECF" />
                </radialGradient>
                </defs>
            </svg>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg bg-white shadow  ring-slate-900/10 p-8">
          <BusinessProgress />
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
