import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { RankingItem } from '@/utils/helpers/ranking-data-types';

interface KeywordTableProps {
  keywords: RankingItem[];
}

const KeywordTable: React.FC<KeywordTableProps> = ({ keywords }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = Math.ceil(keywords.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentKeywords = keywords.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-700">Show</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
          </select>
        </div>
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, keywords.length)}</span> of{' '}
            <span className="font-medium">{keywords.length}</span> results
          </p>
        </div>
      </div>
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
          {currentKeywords.map((item, index) => (
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
                {item.ranked_serp_element.serp_item.rank_changes.is_down && (
                  <ArrowDownIcon
                    aria-hidden="true"
                    className="h-5 w-5 p-1 rounded-full bg-red-500 flex-shrink-0 self-center text-white absolute top-1/2 left-1/2 transform -translate-x-1 -translate-y-1/2 ml-6"
                  />
                )}
                {item.ranked_serp_element.serp_item.rank_changes.is_new && (
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
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, keywords.length)}</span> of{' '}
              <span className="font-medium">{keywords.length}</span> results
            </p>
          </div>
          <div>
            <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={currentPage === 1}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon aria-hidden="true" className="h-5 w-5" />
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage ? 'bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  } focus:z-20 focus:outline-offset-0`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                disabled={currentPage === totalPages}
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordTable;
