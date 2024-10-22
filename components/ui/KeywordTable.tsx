import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface KeywordData {
  keyword: string;
  rank: number;
  searchVolume: number;
  competition: string;
  intent: string;
  relativeUrl: string;
  isNew?: boolean;
  isUp?: boolean;
  isDown?: boolean;
}

interface KeywordTableProps {
  keywords: KeywordData[];
}

const KeywordTable: React.FC<KeywordTableProps> = ({ keywords }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300 text-center">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
              Keyword
            </th>
            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
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
          {keywords?.map((item, index) => (
            <tr key={item.keyword_data.keyword + 'index'} className="even:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                {item.keyword_data.keyword}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 relative">
                {item.ranked_serp_element.serp_item.rank_absolute}
                {item.ranked_serp_element.serp_item.rank_changes.is_up && (
                  <ArrowUpIcon
                    aria-hidden="true"
                    className="h-5 w-5 p-1 rounded-full bg-green-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6"
                  />
                )}
                {item.ranked_serp_element.serp_item.rank_changes.isDown && (
                  <ArrowDownIcon
                    aria-hidden="true"
                    className="h-5 w-5 p-1 rounded-full bg-red-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6"
                  />
                )}
                {item.ranked_serp_element.serp_item.rank_changes.isNew && (
                  <span className="p-1 px-2 rounded-full bg-yellow-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6">
                    New
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.keyword_data.keyword_info.search_volume}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.keyword_data.keyword_info.competition_level}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{item.keyword_data.search_intent_info.main_intent}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                <a href={item.ranked_serp_element.serp_item.url} target="_blank" rel="noopener noreferrer">
                  Link
                </a>
              </td>
            </tr>
          ))}
          {!keywords || keywords.length === 0 && (
                <tr className="even:bg-gray-50">
                  <td colSpan={6} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-3 text-left">
                    Unfortunately, we couldn't find any keywords ranking for this site.
                  </td>
                </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default KeywordTable;

