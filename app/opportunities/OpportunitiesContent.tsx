'use client';

import { User } from '@supabase/supabase-js';
import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import ReactECharts from 'echarts-for-react';
import CompetitorKeywordList from '@/components/ui/CompetitorKeywordList';
import CompetitorOverview from '@/components/ui/CompetitorOverview';
import { CompetitorTitles } from '@/utils/helpers/ranking-data-types';
import OpportunitiesTable from '@/components/ui/OpportunitiesTable';

interface OpportunitiesContentProps {
  user: User;
}

interface SearchIntentData {
  name: string;
  value: number;
  color: string;
}

const SearchIntentChart = ({ data }: { data: SearchIntentData[] }) => {
  const option = {
    legend: {
      show: true,
      top: 10,
      left: 'center'
    },
    series: [
      {
        name: 'Search Intent',
        type: 'pie',
        radius: ['50%', '70%'],
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '22',
            fontWeight: 'bold',
            formatter: '{c}\n({d}%)',
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.color
          }
        }))
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '400px' }} />;
};

const NextContentRecommendation = ({ contentRecommendation }: { contentRecommendation: any }) => {
  if (!contentRecommendation) return null;
  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
      <div className="p-6">
        <h2 className="text-base font-semibold leading-7 text-gray-900">
          Next Piece of Content to Create
        </h2>

        {!contentRecommendation[0] ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading recommendation...</div>
        </div>
        ) : (
          <div className="mt-6 space-y-6">
          <div>
              <h3 className="text-sm font-medium text-gray-900">Type of Content</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].content_type}
              </p>
            </div>
          <div>
              <h3 className="text-sm font-medium text-gray-900">Potential Reach</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].search_volume} Searches per Month
              </p>
            </div>
          <div>
              <h3 className="text-sm font-medium text-gray-900">Çompetition</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].competition}
              </p>
            </div>
          <div>
              <h3 className="text-sm font-medium text-gray-900">Focus Keyword</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].keyword}
              </p>
            </div>
          <div>
              <h3 className="text-sm font-medium text-gray-900">Content Type</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {contentRecommendation[0].content_type}
              </p>
            </div>
            <button>Create with Espy Go</button>
            {/* <div>
              <h3 className="text-sm font-medium text-gray-900">Intent</h3>
              <p className="mt-2 text-sm text-gray-500 capitalize">
                {recommendation.intent} - {recommendation.why}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">What to Create</h3>
              <p className="mt-2 text-sm text-gray-500">
                {recommendation.what}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Focus Keyword</h3>
              <p className="mt-2 text-sm text-gray-500">
                {recommendation.keyword}
              </p>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default function OpportunitiesContent({ user }: OpportunitiesContentProps) {
  const supabase = createClientComponentClient();
  const [rankingData, setRankingData] = useState<any>(null);
  const [contentRecommendations, setContentRecommendations] = useState<any>(null);
  

  useEffect(() => {
    async function fetchRankingData() {
      const { data, error } = await supabase
          .from('business_information')
          .select('rankings_data')
          .eq('user_id', user.id)
          .single()

          const { data: contentRecommendations, error: contentRecommendationsError } = await supabase
          .rpc('get_user_content_recommendations');


      if (error) {
        console.error('Error fetching ranking data:', error);
        return;
      }
      setRankingData(data);
      setContentRecommendations(contentRecommendations);
    }

    fetchRankingData();
  }, [user.id, supabase]);

  const searchIntentData = rankingData ? [
    { 
      name: 'Informational',
      value: rankingData.items?.filter((item: any) => 
        item.keyword_data?.search_intent_info?.main_intent === 'informational'
      ).length || 0,
      color: '#3b82f6'
    },
    { 
      name: 'Commercial',
      value: rankingData.items?.filter((item: any) => 
        item.keyword_data?.search_intent_info?.main_intent === 'commercial'
      ).length || 0,
      color: '#10b981'
    },
    { 
      name: 'Transactional',
      value: rankingData.items?.filter((item: any) => 
        item.keyword_data?.search_intent_info?.main_intent === 'transactional'
      ).length || 0,
      color: '#f59e0b'
    },
    { 
      name: 'Navigational',
      value: rankingData.items?.filter((item: any) => 
        item.keyword_data?.search_intent_info?.main_intent === 'navigational'
      ).length || 0,
      color: '#6366f1'
    }
  ] : [];

  return (
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Opportunities
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NextContentRecommendation contentRecommendation={contentRecommendations} />
        <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
          <div className="p-6">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Current Content Search Intent
            </h2>
            {rankingData ? (
              <SearchIntentChart data={searchIntentData} />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading search intent data...</div>
              </div>
            )}
          </div>
        </div>

      </div>
      <OpportunitiesTable opportunities={contentRecommendations} />
    </div>
  );
}
