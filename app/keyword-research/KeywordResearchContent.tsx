'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useToast } from '@/components/ui/Toasts/use-toast';

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  cpc: number | null;
  competition: string;
  competition_index: number;
  monthly_searches: MonthlySearch[];
  location_code: number;
  language_code: string;
}

interface SeedKeyword {
  id: string;
  keyword: string;
  created_at: string;
}

type SortField = 'keyword' | 'search_volume' | 'cpc' | 'competition' | 'opportunity_score';
type SortDirection = 'asc' | 'desc';

export default function KeywordResearchContent({ user }: { user: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('opportunity_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const [seedKeywords, setSeedKeywords] = useState<SeedKeyword[]>([]);

  const totalPages = Math.ceil((suggestions?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  


  const calculateOpportunityScore = (keyword: KeywordSuggestion): number => {
    const competitionScore = {
      'LOW': 1,
      'MEDIUM': 0.6,
      'HIGH': 0.3,
      '0': 0.5
    }[keyword.competition] || 0.5;

    const volumeScore = Math.min(keyword.search_volume / 2000, 1);
    
    const cpcScore = Math.min(keyword.cpc || 0 / 100, 1);

    const score = Math.round(
      (
        (volumeScore * 0.4) +
        (competitionScore * 0.4) +
        (cpcScore * 0.2)
      ) * 100
    );

    return score;
  };
  
  const getSortedSuggestions = () => {
    return [...suggestions].sort((a, b) => {
      let aValue = a[sortField as keyof KeywordSuggestion];
      let bValue = b[sortField as keyof KeywordSuggestion];

      // Handle opportunity score calculation
      if (sortField === 'opportunity_score') {
        aValue = calculateOpportunityScore(a);
        bValue = calculateOpportunityScore(b);
      }

      // Handle competition sorting
      if (sortField === 'competition') {
        const competitionValues = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, '0': 0 };
        aValue = competitionValues[a.competition as keyof typeof competitionValues] || 0;
        bValue = competitionValues[b.competition as keyof typeof competitionValues] || 0;
      }

      if (sortDirection === 'asc') {
        if (aValue === null || bValue === null) return 0;
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        if (aValue === null || bValue === null) return 0;
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };
  // Get sorted suggestions first
  const sortedSuggestions = getSortedSuggestions();
  // Then slice for pagination
  const currentSuggestions = sortedSuggestions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

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

  const handleSearch = async () => {
    if (!searchTerm) {
      toast({
        title: 'Error',
        description: 'Please enter a keyword to search',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending request for keyword:', searchTerm);
      
      const response = await fetch('/api/keyword-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: searchTerm }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suggestions');
      }

      console.log('Received suggestions:', data);
      setSuggestions(data);
      
      if (data.length === 0) {
        toast({
          title: 'No Results',
          description: 'No keyword suggestions found for your search term.',
          variant: 'default',
        });
      }

    } catch (error) {
      // console.error('Search error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to fetch keyword suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAllGoodOpportunities = async () => {
    const OPPORTUNITY_THRESHOLD = 70;
    
    try {
      const goodOpportunities = suggestions.filter(
        suggestion => calculateOpportunityScore(suggestion) >= OPPORTUNITY_THRESHOLD
      );

      if (goodOpportunities.length === 0) {
        toast({
          title: 'No Good Opportunities',
          description: 'No keywords meet the opportunity threshold.',
          variant: 'default',
        });
        return;
      }

      toast({
        title: 'Adding Keywords',
        description: `Adding ${goodOpportunities.length} keywords...`,
      });

      const results = await Promise.allSettled(
        goodOpportunities.map(suggestion =>
          supabase
            .from('keyword_suggestions')
            .insert({
              user_id: user.id,
              keyword: suggestion.keyword,
              search_volume: suggestion.search_volume,
              competition: suggestion.competition,
              competition_index: suggestion.competition_index || 0,
              cpc: suggestion.cpc || 0,
              monthly_searches: suggestion.monthly_searches || [],
              created_at: new Date().toISOString()
            })
            .select()
            .single()
        )
      );

      const succeeded = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      // Remove successfully added keywords from the suggestions list
      const successfulKeywords = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value.data.keyword);

      setSuggestions(suggestions.filter(
        suggestion => !successfulKeywords.includes(suggestion.keyword)
      ));

      toast({
        title: 'Keywords Added',
        description: (
          <div className="flex flex-col gap-2">
            <p>Successfully added {succeeded} keywords{failed > 0 ? `, ${failed} failed` : ''}.</p>
            <a 
              href="/keyword-list" 
              className="text-sm text-indigo-600 hover:text-indigo-500 underline"
            >
              View your keywords →
            </a>
          </div>
        ),
        variant: 'default',
      });

    } catch (error) {
      // console.error('Error adding keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to add keywords',
        variant: 'destructive',
      });
    }
  };

  const handleAddKeyword = async (suggestion: KeywordSuggestion) => {
    try {
      const { data, error } = await supabase
        .from('keyword_suggestions')
        .insert({
          user_id: user.id,
          keyword: suggestion.keyword,
          search_volume: suggestion.search_volume,
          competition: suggestion.competition,
          competition_index: suggestion.competition_index || 0,
          cpc: suggestion.cpc || 0,
          monthly_searches: suggestion.monthly_searches || [],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Remove the added keyword from the suggestions list
      setSuggestions(suggestions.filter(s => s.keyword !== suggestion.keyword));

      toast({
        title: 'Success',
        description: (
          <div className="flex flex-col gap-2">
            <p>Added "{suggestion.keyword}" to your keyword list</p>
            <a 
              href="/keywords" 
              className="text-sm text-indigo-600 hover:text-indigo-500 underline"
            >
              View your keywords →
            </a>
          </div>
        ),
      });

    } catch (error) {
      // console.error('Error adding keyword:', error);
      toast({
        title: 'Error',
        description: 'Failed to add keyword to your list',
        variant: 'destructive',
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="ml-2 h-4 w-4 inline" /> : 
      <ChevronDownIcon className="ml-2 h-4 w-4 inline" />;
  };

  const handleLoadSuggestedKeywords = async () => {
    setIsLoadingSuggestions(true);
    try {
      const { data: keywords, error } = await supabase
        .from('seed_keyword_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!keywords.length) {
        toast({
          title: 'No Keywords Found',
          description: 'You haven\'t added any seed keywords yet.',
          variant: 'default',
        });
        return;
      }

      setSeedKeywords(keywords);
      setShowSuggestionsModal(true);

    } catch (error) {
      // console.error('Error loading suggested keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to load suggested keywords',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSelectKeyword = async (keyword: string) => {
    await setSearchTerm(keyword);
    setShowSuggestionsModal(false);
    await handleSearch();
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="w-full rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Keyword Research</h1>
        <div className="mt-4 border-t border-gray-200 pt-4 w-full">
          <p className="mt-2 text-sm text-gray-700">
            Research keywords and find new opportunities for your content.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <input
          type="text"
          placeholder="Enter a keyword to research..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full max-w-md rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
        <button 
          onClick={handleSearch}
          disabled={isLoading}
          type="button"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={handleLoadSuggestedKeywords}
          disabled={isLoadingSuggestions}
          type="button"
          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoadingSuggestions ? 'Loading...' : 'Suggest Keywords'}
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto">
        {!suggestions.length ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No keywords yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by searching for a keyword above.
            </p>
            <div className="mt-6">
              <table className="min-w-full divide-y divide-gray-300 text-center opacity-50">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                      Keyword
                    </th>
                    <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Opportunity
                    </th>
                    <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Search Volume
                    </th>
                    <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      CPC
                    </th>
                    <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Competition
                    </th>
                    <th className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, idx) => (
                    <tr key={idx} className="even:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-400 sm:pl-3 text-left">
                        Example Keyword
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        75
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        1,500
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        £0.50
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        LOW
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                        Add
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <label htmlFor="itemsPerPage" className="mr-2 text-sm font-medium text-gray-700">Show</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                </select>
              </div>
              <button
                onClick={handleAddAllGoodOpportunities}
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add All Good Opportunities
              </button>
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, suggestions.length)}</span> of{' '}
                  <span className="font-medium">{suggestions.length}</span> results
                </p>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-300 text-center">
              <thead>
                <tr>
                  <th 
                    scope="col" 
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3 cursor-pointer"
                    onClick={() => handleSort('keyword')}
                  >
                    Keyword <SortIcon field="keyword" />
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('opportunity_score')}
                  >
                    Opportunity <SortIcon field="opportunity_score" />
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('search_volume')}
                  >
                    Search Volume <SortIcon field="search_volume" />
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('cpc')}
                  >
                    CPC <SortIcon field="cpc" />
                  </th>
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-sm font-semibold text-gray-900 cursor-pointer"
                    onClick={() => handleSort('competition')}
                  >
                    Competition <SortIcon field="competition" />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {currentSuggestions.map((suggestion, idx) => {
                  const opportunityScore = calculateOpportunityScore(suggestion);
                  return (
                    <tr key={suggestion.keyword + idx} className="even:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                        {suggestion.keyword}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <div className="flex items-center justify-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${opportunityScore >= 70 ? 'bg-green-100 text-green-800' : 
                              opportunityScore >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {opportunityScore}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {suggestion.search_volume}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        £{suggestion.cpc?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {suggestion.competition === '0' ? 'Unknown' : suggestion.competition}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <button
                          onClick={() => handleAddKeyword(suggestion)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, suggestions.length)}</span> of{' '}
                    <span className="font-medium">{suggestions.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                      disabled={currentPage === 1}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
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
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Transition.Root show={showSuggestionsModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowSuggestionsModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setShowSuggestionsModal(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div>
                    <div className="mt-3 text-center sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Select a Seed Keyword
                      </Dialog.Title>
                      <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        <ul role="list" className="divide-y divide-gray-100">
                          {seedKeywords.map((keyword) => (
                            <li
                              key={keyword.id}
                              className="flex items-center justify-between gap-x-6 py-2 cursor-pointer hover:bg-gray-50 px-4 rounded-lg"
                              onClick={() => handleSelectKeyword(keyword.keyword)}
                            >
                              <div className="min-w-0">
                                <div className="flex items-start gap-x-3">
                                  <p className="text-sm font-semibold leading-6 text-gray-900">
                                    {keyword.keyword}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
} 