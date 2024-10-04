'use client';

import { User } from '@supabase/supabase-js';
import SampleData from './sample-ranking-response.json';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';
import {Chart, ArcElement, Title, Tooltip, Legend, Colors} from 'chart.js'
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), {
  ssr: false,
});
Chart.register(ArcElement, Title, Tooltip, Legend, Colors);

interface RankingsContentProps {
  user: User;
}

export default function RankingsContent({ user }: RankingsContentProps) {
  const {result} = SampleData;
  const stats = [
    { name: 'Total Keywords Ranking', stat: result[0].total_count, change: parseInt((result[0].metrics.organic.is_new - result[0].metrics.organic.is_lost) / result[0].metrics.organic.count *100) + '%', changeType: 'increase' },
    { name: 'Total Organic No.1', stat: result[0].metrics.organic.pos_1 },
    { name: 'Total Paid No.1', stat: result[0].metrics.paid.pos_1},
  ]
  const keywordStats = [
    { name: 'New Keywords', stat: result[0].metrics.organic.is_new},
    { name: 'Lost Keywords', stat: result[0].metrics.organic.is_lost},
    { name: 'Ranking went up', stat: result[0].metrics.paid.is_up },
    { name: 'Ranking went down', stat: result[0].metrics.paid.is_down },
  ]
  const options = {
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const getKeywordMetrics = (type: String) => {
    return  {
      labels: ['1', '2/3', '4-10', '11-20', '21-30', '31-40', '41-100'],
      datasets: [
        {
          label: '# of Keywords',
          data: [
            result[0].metrics[type].pos_1,
            result[0].metrics[type].pos_2_3,
            result[0].metrics[type].pos_4_10,
            result[0].metrics[type].pos_11_20,
            result[0].metrics[type].pos_21_30,
            result[0].metrics[type].pos_31_40,
            result[0].metrics[type].pos_41_50 +
            result[0].metrics[type].pos_51_60 + result[0].metrics[type].pos_61_70 + result[0].metrics[type].pos_71_80 + result[0].metrics[type].pos_81_90 + result[0].metrics[type].pos_91_100,
          ],
        },
      ]
    };
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  console.log('SampleData', result[0]);
  return (
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Keyword Rankings</h1>
      </div>
      <h3 className="text-base font-semibold leading-6 text-gray-900 mt-6 ml-6">Last 30 days</h3>
      <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-3 md:divide-x md:divide-y-0">
        {stats.map((item) => (
          <div key={item.name} className="px-4 py-5 sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
            <dd className="mt-1 flex items-center md:block lg:flex">
              <div className="flex items-baseline text-3xl font-medium leading-10 tracking-tight text-gray-900 mr-4">
                {item.stat}
              </div>
            {item.change && (
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
          <div className='relative'>
            <Doughnut data={getKeywordMetrics('organic')} options={options} className='p-4'  />
            <span className='font-serif absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pb-1 text-6xl font-bold'>{ result[0].metrics.organic.count }</span>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <h2 className="truncate text-sm font-medium text-gray-500">Paid Ranking Distribution (by position)</h2>
          <div className='relative'>
            <Doughnut data={getKeywordMetrics('paid')}  options={options}   />
            <span className='font-serif absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pt-1 text-6xl font-bold'>{ result[0].metrics.paid.count }</span>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 ">
            <table className="min-w-full divide-y divide-gray-300  text-center">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                    Keyword
                  </th>
                  <th scope="col" className="px-3 py-3.5  text-sm font-semibold text-gray-900">
                    Rank
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                    Search Volume
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                    Competition
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                    Intent
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                    Page
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {result[0].items.map((item) => (
                  <tr key={item.keyword_data.keyword} className="even:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                      {item.keyword_data.keyword}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 relative">
                      {item.ranked_serp_element.serp_item.rank_absolute}

                      {item.ranked_serp_element.serp_item.rank_changes.is_up &&
                      <ArrowUpIcon
                        aria-hidden="true"
                        className="h-5 w-5 p-1 rounded-full bg-green-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6"
                      />}

                      {item.ranked_serp_element.serp_item.rank_changes.is_down &&
                      <ArrowDownIcon
                        aria-hidden="true"
                        className="h-5 w-5 p-1 rounded-full bg-red-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6"
                      />}

                      {item.ranked_serp_element.serp_item.rank_changes.is_new &&
                      <span
                      className="p-1 px-2 rounded-full bg-yellow-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6">New</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.keyword_data.keyword_info.search_volume}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.keyword_data.keyword_info.competition_level}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{item.keyword_data.search_intent_info.main_intent}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><a href={item.ranked_serp_element.serp_item.relative_url} target="_blank" rel="noopener noreferrer">Link</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
    </div>

    </div>
  );
}