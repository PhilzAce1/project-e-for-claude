'use client'

import { useState, useEffect } from 'react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, TrashIcon } from '@heroicons/react/20/solid'
import KeywordTable from './KeywordTable'
import RankingsSummaryView from './RankingsSummaryView'
import { Rankings, RankingItem } from '@/utils/helpers/ranking-data-types'
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs'
import { CompetitorTitles } from '@/utils/helpers/ranking-data-types';
import { toast } from '@/components/ui/Toasts/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./AlertDialog"

interface CompetitorKeywordListProps {
  competitors: CompetitorTitles[];
  userId: string;
}
// Update the Competitor interface to match Rankings
interface Competitor extends Rankings {
  // Add any additional properties specific to Competitor
  user_id?: string;
}

const CompetitorKeywordList = ({ competitors, userId }: CompetitorKeywordListProps) => {
    const [selected, setSelected] = useState<CompetitorTitles | null>(null)
    const [isLoading, setIsLoading] = useState(true);
    const [keywords, setKeywords] = useState<RankingItem[]>([]);
    const supabase = createClientComponentClient();
    const [currentCompetitor, setCurrentCompetitor] = useState<Competitor | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [updatedCompetitors, setUpdatedCompetitors] = useState<CompetitorTitles[]>(competitors);

    useEffect(() => {
        if (competitors && competitors.length > 0) {
            setSelected(competitors[0])
            setIsLoading(false)
        }
    }, [competitors]);

    useEffect(() => {
        if (selected) {
            setIsLoading(true);
            fetchCurrentCompetitor(selected.id);
        }
    }, [selected]);

    useEffect(() => {
        if (selected && currentCompetitor) {
            fetchKeywords(currentCompetitor);
        }
    }, [currentCompetitor]);

    async function fetchCurrentCompetitor(id: number) {
      const { data: competitor, error } = await supabase
        .from('competitors')
        .select('id, domain, items, metrics, total_count, rankings_updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching competitor:', error);
        return;
      }

      setCurrentCompetitor(competitor);
    }

    const fetchKeywords = async (competitor: Rankings) => {
        try {
            setKeywords(competitor.items || []);
        } catch (error) {
            console.error('Error fetching keywords:', error);
            setKeywords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompetitorChange = (newSelected: Rankings) => {
        setSelected(newSelected);
    };

    const handleRemoveCompetitor = async () => {
        if (!selected) return;
        
        try {
            const { error } = await supabase
                .from('competitors')
                .delete()
                .eq('id', selected.id)
                .eq('user_id', userId);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            // Update the local state to remove the competitor
            const updatedCompetitors = competitors.filter(c => c.id !== selected.id);
            
            setUpdatedCompetitors(updatedCompetitors);
            if (updatedCompetitors.length > 0) {
                setSelected(updatedCompetitors[0]);
            } else {
                setSelected(null);
            }

            toast({
                title: "Competitor Removed",
                description: `Successfully removed ${selected.domain}`,
            });

        } catch (error) {
            console.error('Error removing competitor:', error);
            toast({
                title: "Error",
                description: "Failed to remove competitor. Please try again.",
                variant: "destructive"
            });
        } finally {
            setShowDeleteDialog(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const formattedDate = formatDate(currentCompetitor?.rankings_updated_at);

    return (
        <>
            <div className='justify-between flex mt-8'>
                <div className='flex items-center gap-4 mb-4'>
                    <Listbox value={selected} onChange={handleCompetitorChange}>
                    <Label className="block text-sm font-medium leading-6 text-gray-900">Show Competitor</Label>
                    <div className="relative">
                        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                            <span className="block truncate">{selected?.domain}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
                            </span>
                        </ListboxButton>

                        <ListboxOptions
                            transition
                            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
                        >
                            {updatedCompetitors.map((competitor) => (
                                <ListboxOption
                                    key={competitor.id}
                                    value={competitor}
                                    className="group relative cursor-default select-none py-2 pl-8 pr-4 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                                >
                                    <span className="block truncate font-normal group-data-[selected]:font-semibold">{competitor.domain}</span>

                                    <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                                        <CheckIcon aria-hidden="true" className="h-5 w-5" />
                                    </span>
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </div>
                </Listbox>
                
                {selected && (
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100"
                    >
                        <TrashIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                        Remove Competitor
                    </button>
                )}
            </div>
            Last Crawled: {formattedDate}
            </div>
            <KeywordTable keywords={keywords} userId={userId} showPayLink={true} />
            {(selected && currentCompetitor) && <RankingsSummaryView rankings={currentCompetitor} />}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Competitor</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove {selected?.domain}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveCompetitor}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function formatDate(timestamp: string | undefined): string {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    
    // Use Intl.DateTimeFormat for localized date and time formatting
    const formatter = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    });
  
    return formatter.format(date);
}

export default CompetitorKeywordList
