import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import CompetitionBadge from './CompetitionBadge';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { LoadingOverlay } from './LoadingOverlay';

const KeywordTable = ({ opportunities }: { opportunities: any }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();
  const { toast } = useToast();
  console.log(opportunities)

  if (!opportunities || opportunities.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(opportunities.length / itemsPerPage);

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
  const currentopportunities = opportunities.slice(startIndex, startIndex + itemsPerPage);

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

  const handleCreateContent = async (keyword: {
    keyword: string;
    search_volume: number;
    competition: number;
    main_intent: string;
  }) => {
    setIsProcessing(true);

    try {
      // Get the price for the product
      const response = await fetch('/api/get-product-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'prod_RJ5FCKb73rXqQM',
          metadata: {
            keyword: keyword.keyword,
            search_volume: keyword.search_volume,
            competition: keyword.competition,
            main_intent: keyword.main_intent
          }
        })
      });

      const { price } = await response.json();
      
      if (!price) {
        throw new Error('No price found for this product');
      }

      const { errorRedirect, sessionId } = await checkoutWithStripe(
        price,
        `${currentPath}?keyword=${encodeURIComponent(keyword.keyword)}`
      );

      if (errorRedirect) {
        setIsProcessing(false);
        return router.push(errorRedirect);
      }

      if (!sessionId) {
        throw new Error('No session id returned');
      }

      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });

      setIsProcessing(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  return (
    <>
      {isProcessing && <LoadingOverlay />}
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, opportunities.length)}</span> of{' '}
              <span className="font-medium">{opportunities.length}</span> results
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
                Search Volume
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                Competition
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                Intent
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currentopportunities.map((item: any, index: any) => (
              <tr key={item.keyword + index} className="even:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                  {item.keyword}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.search_volume}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><CompetitionBadge value={item.competition} /></td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">{item.main_intent}</td>
                <td className=''>
                  <button
                    onClick={() => handleCreateContent(item)}
                    className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Create Content
                  </button>
                </td>
              </tr>
            ))}
            {!opportunities || opportunities.length === 0 && (
                  <tr className="even:bg-gray-50">
                    <td colSpan={6} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-3 text-left">
                      Unfortunately, we couldn't find any opportunities ranking for this site.
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
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, opportunities.length)}</span> of{' '}
                <span className="font-medium">{opportunities.length}</span> results
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
    </>
  );
};

export default KeywordTable;
