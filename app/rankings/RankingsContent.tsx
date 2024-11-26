'use client';

import { User } from '@supabase/supabase-js';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import {Chart, ArcElement, Title, Tooltip, Legend, Colors} from 'chart.js'
import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import KeywordTable from '@/components/ui/KeywordTable';
import { RankingItem } from '@/utils/helpers/ranking-data-types';
import ZeroStateHero from '@/components/ZeroStateHero';

const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
});
Chart.register(ArcElement, Title, Tooltip, Legend, Colors);

interface Metrics {
  pos_1: number;
  pos_2_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_30: number;
  pos_31_40: number;
  pos_41_50: number;
  pos_51_60: number;
  pos_61_70: number;
  pos_71_80: number;
  pos_81_90: number;
  pos_91_100: number;
  etv: number;
  impressions_etv: number;
  count: number;
  estimated_paid_traffic_cost: number;
  is_new: number;
  is_up: number;
  is_down: number;
  is_lost: number;
}


interface RankingsData {
  total_count: number;
  metrics: {
    organic: Metrics;
    paid: Metrics;
  };
  items: RankingItem[];
}

interface RankingsContentProps {
  user: User;
  rankingsData: RankingsData;
  lastCrawlDate: string;
}

export default function RankingsContent({ user, rankingsData, lastCrawlDate }: RankingsContentProps) {
  if (!rankingsData) {
    return (
      <ZeroStateHero 
        title="Kickstart Your SEO Strategy Now!"
        subtitle="We need to start by learning about your business."
        description="Enter your domain below to begin."
        ctaText="Start Now"
        user={user}
        imageSrc="/rank-image.webp"
        fullPage={true}
    />
    );
  }
  const [showNoKeywordsModal, setShowNoKeywordsModal] = useState(false);
  const {total_count, metrics, items} = rankingsData;

  useEffect(() => {
    console.log('total_count', total_count)
    if (!total_count) {
      setShowNoKeywordsModal(true);
    }
  }, [total_count]);

  console.log('rankingsData', rankingsData);
  const stats = [
    { name: 'Total Keywords Ranking', stat: total_count || 0, change: ((metrics?.organic.is_new - metrics?.organic.is_lost) / metrics?.organic.count * 100).toFixed(2) + '%', changeType: 'increase' },
    { name: 'Total Organic No.1', stat: metrics?.organic.pos_1 || 0 },
    { name: 'Total Paid No.1', stat: metrics?.paid.pos_1 || 0},
  ]
  const keywordStats = [
    { name: 'New Keywords', stat: metrics?.organic.is_new || 0},
    { name: 'Lost Keywords', stat: metrics?.organic.is_lost || 0},
    { name: 'Ranking went up', stat: metrics?.organic.is_up || 0 },
    { name: 'Ranking went down', stat: metrics?.organic.is_down || 0 },
  ]
  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const getKeywordMetrics = (type: 'organic' | 'paid') => {
    return  {
      labels: ['1', '2/3', '4-10', '11-20', '21-30', '31-40', '41-100'],
      datasets: [
        {
          label: '# of Keywords',
          data: [
            metrics[type].pos_1,
            metrics[type].pos_2_3,
            metrics[type].pos_4_10,
            metrics[type].pos_11_20,
            metrics[type].pos_21_30,
            metrics[type].pos_31_40,
            metrics[type].pos_41_50 +
            metrics[type].pos_51_60 + metrics[type].pos_61_70 + metrics[type].pos_71_80 + metrics[type].pos_81_90 + metrics[type].pos_91_100,
          ],
        },
      ]
    };
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  return (
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Keyword Rankings</h1>
      </div>
      <h3 className="text-base font-semibold leading-6 text-gray-900 mt-6 ml-6">Last Crawled - {new Date(lastCrawlDate).toLocaleDateString()}</h3>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 flex items-center md:block lg:flex">
              <div className="flex items-baseline text-3xl font-medium leading-10 tracking-tight text-gray-900 mr-4">
                {item.stat}
              </div>
            {(item.change && total_count) && (
              <div
                className={classNames(
                  item.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                  'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0',
                )}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon
                    aria-hidden="true"
                    className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-gray-900"
                  />
                ) : (
                  <ArrowDownIcon
                    aria-hidden="true"
                    className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-white"
                  />
                )}

                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </div>
            )}
            </dd>
          </div>
        ))}
      </dl>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-4 md:divide-x md:divide-y-0">
        {keywordStats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 flex items-center md:block lg:flex">
              <div className="flex items-baseline text-3xl font-medium leading-10 tracking-tight text-gray-900 mr-4">
                {item.stat}
              </div>
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="truncate text-sm font-medium text-gray-500">Organic Ranking Distribution (by position)</h2>
          <div className='relative min-h-60'>
          { metrics?.organic.count && (<Doughnut data={getKeywordMetrics('organic')} options={options} className='p-4 relative z-10'  />) }
            <span className='font-serif absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pb-1 text-6xl font-bold'>{ metrics?.organic.count || 0 }</span>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <h2 className="truncate text-sm font-medium text-gray-500">Paid Ranking Distribution (by position)</h2>
          <div className='relative  min-h-60'>
          { metrics?.paid.count  && (<Doughnut data={getKeywordMetrics('paid')}  options={options}  className='p-4 relative z-10'  />)}
            <span className='font-serif absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pt-1 text-6xl font-bold'>{ metrics?.paid.count || 0 }</span>
          </div>
        </div>
      </div>
      <KeywordTable keywords={items} />

      <Transition appear show={showNoKeywordsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50 " onClose={() => setShowNoKeywordsModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto ">
            <div className="flex min-h-full items-center justify-center p-4 text-center ">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
          <div className="relative bg-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-8">
              <div className="mx-auto max-w-2xl py-24 lg:max-w-none lg:py-64">
                <div className="lg:pr-16">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
                    Zero Keywords Ranking!
                  </h1>
                  <p className="mt-4 text-xl text-gray-600">
                    This sucks, we know. 
                  </p>
                  <p className="mt-4 text-xl text-gray-600">
                    Let's get you ranking for your first keywords.
                  </p>
                  <div className="mt-6">
                    <a
                      href="/competitors"
                      className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
                    >
                      Start Ranking now!
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-48 w-full sm:h-64 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-1/2">
            <img
              alt=""
              src="/rank-image.webp"
              className="h-full w-full object-cover object-center"
            />
          </div>

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}