'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface KeywordSuggestion {
  id: string;
  keyword: string;
  search_volume: number;
  cpc: number;
  competition: string;
  competition_index: number;
  monthly_searches: MonthlySearch[];
  created_at: string;
}

type SortField = 'keyword' | 'search_volume' | 'cpc' | 'competition' | 'opportunity_score';
type SortDirection = 'asc' | 'desc';

export default function KeywordListContent({ user }: { user: any }) {
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('opportunity_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const router = useRouter();

  const totalPages = Math.ceil((keywords?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const { data, error } = await supabase
        .from('keyword_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKeywords(data || []);
    } catch (error) {
    //   // console.error('Error loading keywords:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your keywords',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOpportunityScore = (keyword: KeywordSuggestion): number => {
    const competitionScore = {
      'LOW': 1,
      'MEDIUM': 0.6,
      'HIGH': 0.3,
      '0': 0.5
    }[keyword.competition] || 0.5;

    const volumeScore = Math.min(keyword.search_volume / 2000, 1);
    const cpcScore = Math.min(keyword.cpc / 100, 1);

    return Math.round(
      ((volumeScore * 0.4) + (competitionScore * 0.4) + (cpcScore * 0.2)) * 100
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedKeywords = () => {
    return [...keywords]
      .filter(keyword => 
        keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let aValue = a[sortField as keyof KeywordSuggestion];
        let bValue = b[sortField as keyof KeywordSuggestion];

        if (sortField === 'opportunity_score') {
          aValue = calculateOpportunityScore(a);
          bValue = calculateOpportunityScore(b);
        }

        if (sortField === 'competition') {
          const competitionValues = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, '0': 0 };
          aValue = competitionValues[a.competition as keyof typeof competitionValues] || 0;
          bValue = competitionValues[b.competition as keyof typeof competitionValues] || 0;
        }

        return sortDirection === 'asc' ? 
          (aValue > bValue ? 1 : -1) : 
          (aValue < bValue ? 1 : -1);
      });
  };

  const sortedKeywords = getSortedKeywords();
  const currentKeywords = sortedKeywords.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="ml-2 h-4 w-4 inline" /> : 
      <ChevronDownIcon className="ml-2 h-4 w-4 inline" />;
  };

  const handleCreateContent = (keyword: string) => {
    router.push(`/create-content/${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="w-full rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Your Keywords
        </h1>
        <div className="mt-4 border-t border-gray-200 pt-4 w-full">
          <p className="mt-2 text-sm text-gray-700">
            View and manage your saved keywords.
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow overflow-x-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading your keywords...</p>
          </div>
        ) : !keywords.length ? (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No keywords yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by adding keywords from the research tool.
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(startIndex + itemsPerPage, sortedKeywords.length)}
                  </span> of{' '}
                  <span className="font-medium">{sortedKeywords.length}</span> keywords
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
                  <th 
                    scope="col" 
                    className="px-3 py-3.5 text-sm font-semibold text-gray-900"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {currentKeywords.map((keyword) => {
                  const opportunityScore = calculateOpportunityScore(keyword);
                  return (
                    <tr key={keyword.id} className="even:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                        {keyword.keyword}
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
                        {keyword.search_volume}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        £{keyword.cpc?.toFixed(2) || '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {keyword.competition === '0' ? 'Unknown' : keyword.competition}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <button
                          onClick={() => handleCreateContent(keyword.keyword)}
                          className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                          Create Content
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(startIndex + itemsPerPage, keywords.length)}</span> of{' '}
                    <span className="font-medium">{keywords.length}</span> keywords
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
    </div>
  );
}