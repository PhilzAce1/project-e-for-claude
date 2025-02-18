'use client';

import { User } from '@supabase/supabase-js';
import { useState, Fragment, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactECharts from 'echarts-for-react';
import OpportunitiesTable from '@/components/ui/OpportunitiesTable';
import { NextContentRecommendation } from '@/components/ui/NextContentRecommendation';

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


export default function OpportunitiesContent({ user }: OpportunitiesContentProps) {
  const supabase = createClientComponentClient();
  const [rankingData, setRankingData] = useState<any>(null);
  const [contentRecommendations, setContentRecommendations] = useState<any>(null);
  
  const fetchContentRecommendations = async () => {
    const { data: recommendations, error } = await supabase
      .rpc('get_user_content_recommendations');

    if (error) {
      console.error('Error fetching recommendations:', error);
      return;
    }
    setContentRecommendations(recommendations);
  };

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('business_information')
        .select('rankings_data')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching ranking data:', error);
        return;
      }
      setRankingData(data);
      fetchContentRecommendations();
    }

    fetchData();
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
      <div className="w-full rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Opportunities
        </h1>
        <div className="mt-4 border-t border-gray-200 pt-4 w-full">
          <h2 className="text-lg font-bold">What is this?</h2>
          <p className="text-sm text-gray-600 mb-2 w-2/3">
            This is one of your most important views in Espy Go. Here you can see all the opportunities for your business.
          </p>
          <p className="text-sm text-gray-600 mb-2 w-2/3">
            Our recommendation engine will suggest content opportunities based on your business and your competitors. We recommend you simply start from the top and create and publish content to rank higher than your competitors.
          </p>
          <p className="text-sm text-gray-600 w-2/3">
            You can also submit content orders to create content for your business.
          </p>
        </div>
      </div>

        <NextContentRecommendation 
          contentRecommendation={contentRecommendations} 
          userId={user.id}
          onUpdate={fetchContentRecommendations}
        />
        {/* <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
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
        </div> */}

        <div className="relative md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-4 px-8 mt-4 ">
        <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:text-lg sm:tracking-tight">
          More Opportunities
        </h2>
      </div>
      <OpportunitiesTable 
        opportunities={contentRecommendations} 
        userId={user.id}
      />
    </div>
  );
}
