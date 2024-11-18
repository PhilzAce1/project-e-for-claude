import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { fieldContexts } from '@/utils/business-analyzer/types';
import * as Tooltip from '@radix-ui/react-tooltip';
import { InformationCircleIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';

interface BusinessSummaryProps {
  analysisId: string;
}

export const BusinessSummary: React.FC<BusinessSummaryProps> = ({ analysisId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnswers = async () => {
      try {
        // Fetch all answers for this analysis
        const { data: answers, error } = await supabase
          .from('business_analysis_answers')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('category', { ascending: true });

        if (error) throw error;

        // Add console.log to debug the data structure
        console.log('Raw answers:', answers);

        // Group answers by category
        const groupedData = answers.reduce((acc: any, answer) => {
          if (!acc[answer.category]) {
            acc[answer.category] = [];
          }
          acc[answer.category].push(answer);
          return acc;
        }, {});

        console.log('Grouped data:', groupedData);
        setData(groupedData);
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching answers:', error);
        toast({
          title: 'Error loading business summary',
          description: error.message,
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchAnswers();
  }, [analysisId, supabase, toast]);

  const renderAnswer = (answer: any) => {
    const context = fieldContexts[answer.field_name];

    // If answer has type property (verification answers)
    if (answer.answer?.type === 'list') {
      return (
        <ul className={`mt-4 space-y-1 ${colorClasses[0]} px-8 py-4 rounded-lg  divide-y divide-gray-100/30 text-sm`}>
          {answer.answer.items.map((item: string, i: number) => (
            <li key={i} className="py-2">{item}</li>
          ))}
        </ul>
      );
    }

    if (answer.answer?.type === 'object') {
      return (
        <div className="">
          {answer.answer.items.map((item: { key: string; value: string[] }, i: number) => (
            <div key={i}  className={`mt-4 space-y-1 bg-violet-900 px-8 py-4 rounded-lg text-white ${colorClasses[i % colorClasses.length]}`}> 
              <h5 className="font-bold text-xl">
                {context?.subsections?.[item.key]?.title || 
                  item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h5>
              {context?.subsections?.[item.key]?.description && (
                <p className="">{context.subsections[item.key].description}</p>
              )}
              <ul className="divide-y divide-gray-100/30 text-sm">
                {item.value.map((val: string, j: number) => (
                  <li key={j} className="py-2">{val}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    // If answer is a direct object with arrays (critical/recommended answers)
    if (typeof answer.answer === 'object' && !Array.isArray(answer.answer)) {
      return (
        <div className="space-y-4">
          {Object.entries(answer.answer).map(([key, values]: [string, any], index: number) => (
            <div key={key}  className={`mt-4 space-y-1  px-8 py-4 rounded-lg text-white ${colorClasses[index % colorClasses.length]}`}>
              <h5 className="font-bold text-xl">
                {context?.subsections?.[key]?.title || 
                  key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h5>
              {Array.isArray(values) && values.length > 0 ? (
                <ul className="divide-y divide-gray-100/30 text-sm">
                  {values.map((value: string, i: number) => (
                    <li key={i} className="py-2">{value}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic opacity-60">No data supplied</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // If answer is an array
    if (Array.isArray(answer.answer)) {
      return (
        <ul className="mt-2 space-y-1">
          {answer.answer.map((item: string, i: number) => (
            <li key={i} className="text-sm text-gray-600">{item}</li>
          ))}
        </ul>
      );
    }

    // Fallback for simple values
    return <p className="text-sm text-gray-600">{String(answer.answer || 'No data available')}</p>;
  };

  const renderFieldHeader = (fieldName: string, category: string) => {
    const context = fieldContexts[fieldName];
    
    return (
      <span>
        <h4 className="text-base/7 font-semibold">
          {context?.title || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </h4>
        {context?.description && <p className="">{context.description}</p>}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading business summary...</div>;
  }

  if (!data) {
    return <div className="text-center py-12">No business data available.</div>;
  }

  const categoryTitles = {
    marketPosition: 'Market Position',
    technicalSpecifics: 'Technical Specifics',
    coreBusiness: 'Core Business',
    customerJourney: 'Customer Journey'
  };
  const categoryDescriptions = {
    marketPosition: 'How your business stands out in the market, including your competitive advantages, unique value propositions, and market positioning.',
    technicalSpecifics: 'Technical details and specifications about your products, services, and operations, including industry standards and requirements.',
    coreBusiness: 'The fundamental aspects of your business, including your offerings, target customers, and business model.',
    customerJourney: 'How customers interact with your business, from initial awareness through the buying process and beyond.'
  };

  const colorClasses = [
    'bg-amber-100 text-amber-900',
    'bg-emerald-100 text-emerald-900',
    'bg-purple-100 text-purple-900',
  ]

  return (
    <>
      {Object.entries(data || {}).map(([category, answers]: [string, any]) => (
    <div className=" mb-8 rounded-lg ring-1 bg-white ring-slate-900/10 ">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:pt-32 lg:px-8 lg:py-20">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 pr-8">
          <div className="lg:col-span-5">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              {categoryTitles[category as keyof typeof categoryTitles] || category}
            </h2>
            <p className="mt-4 text-pretty text-base/7 text-gray-600">
              {categoryDescriptions[category as keyof typeof categoryDescriptions]}
            </p>
          </div>
          <div className="mt-10 lg:col-span-7 lg:mt-0">

              <dl className="space-y-6 divide-y divide-gray-900/10">
                {answers.map((answer: any, index: number) => (
                  <Disclosure key={index} as="div" className="pt-6">
                    <dt>
                      <DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900">
                        {renderFieldHeader(answer.field_name, category)}
                        <span className="ml-6 flex h-7 items-center">
                          <PlusIcon aria-hidden="true" className="size-6 group-data-[open]:hidden" />
                          <MinusIcon aria-hidden="true" className="size-6 [.group:not([data-open])_&]:hidden" />
                        </span>
                      </DisclosureButton>
                    </dt>
                    <DisclosurePanel as="dd" className="mt-2 pr-12">
                      {renderAnswer(answer)}
                    </DisclosurePanel>
                  </Disclosure>
                ))}
              </dl>
          </div>
        </div>
      </div>
    </div>
        ))}
    </>
  );
};
