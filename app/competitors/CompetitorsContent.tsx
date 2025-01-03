'use client';

import { User } from '@supabase/supabase-js';
import { useState, Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import CompetitorKeywordList from '@/components/ui/CompetitorKeywordList';
import CompetitorOverview from '@/components/ui/CompetitorOverview';
import { CompetitorTitles } from '@/utils/helpers/ranking-data-types';

interface CompetitorsContentProps {
  user: User;
}

const onboardingSteps = [
  {
    title: "Welcome to Competitor Analysis!",
    content: "Let's get started by adding your top competitors. This will help us provide better insights for your SEO strategy.",
  },
  {
    title: "Add Your Competitors",
    content: "Enter the domains of your competitors. This should be a website that directly competes with your business in search results.",
  },
  {
    title: "Competitor Analysis Complete",
    content: "Excellent! You've added your top competitors. We'll now analyze their SEO strategies to help improve your rankings.",
  }
];

export default function CompetitorsContent({ user }: CompetitorsContentProps) {
    const [competitors, setCompetitors] = useState<CompetitorTitles[]>([]);
    const [newCompetitors, setNewCompetitors] = useState(['']);
    const [inputErrors, setInputErrors] = useState<string[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const supabase = createClientComponentClient();
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false);
    const competitorOverviewRef = useRef<{ refresh: () => Promise<void> }>(null);
  
    const handleRefresh = () => {
      competitorOverviewRef.current?.refresh();
    };
  
    const handleRefreshRequest = () => {
      // Do any additional refresh logic here
      console.log('Refresh requested from CompetitorOverview');
    };
  
    useEffect(() => {
      fetchCompetitors();
    }, []);
  
    async function fetchCompetitors() {
      const { data: competitors, error } = await supabase
        .from('competitors')
        .select('id, domain')
        .eq('user_id', user.id);
  
      if (error) {
        console.error('Error fetching competitors:', error);
        return;
      }

      if(competitors.length === 0) {
        console.log('Competitors', competitors);
        setShowOnboarding(true);
      }
  
      // Transform string IDs to numbers if needed
      const transformedCompetitors = competitors?.map(comp => ({
        ...comp,
        id: Number(comp.id) // Convert string ID to number
      })) || [];
  
      setCompetitors(transformedCompetitors);
    }
  
    const validateUrl = (url: string) => {
      const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
      return pattern.test(url);
    }
  
    const cleanDomain = (domain: string): string => {
      // Remove protocol (http:// or https://)
      let cleanedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');

      // Remove everything after the first slash (if present)
      cleanedDomain = cleanedDomain.split('/')[0];

      // Remove port number if present
      cleanedDomain = cleanedDomain.split(':')[0];

      return cleanedDomain;
    }
  
    const normalizeUrl = (url: string) => {
      return `https://${cleanDomain(url)}`;
    }
  
    const handleAddCompetitor = () => {
      setShowOnboarding(true);
      setOnboardingStep(1);
    };
  
    const handleInputChange = (index: number, value: string) => {
      const updatedCompetitors = [...newCompetitors];
      updatedCompetitors[index] = value;
      setNewCompetitors(updatedCompetitors);
  
      const updatedErrors = [...inputErrors];
      updatedErrors[index] = '';
      setInputErrors(updatedErrors);
    };
  
    const handleAddInput = () => {
      if (newCompetitors.length < 3) {
        setNewCompetitors([...newCompetitors, '']);
        setInputErrors([...inputErrors, '']);
      }
    };
  
    const handleRemoveInput = (index: number) => {
      if (newCompetitors.length > 1) {
        const updatedCompetitors = newCompetitors.filter((_, i) => i !== index);
        const updatedErrors = inputErrors.filter((_, i) => i !== index);
        setNewCompetitors(updatedCompetitors);
        setInputErrors(updatedErrors);
      }
    };
  
    const fetchCompetitorRankings = async (competitor: { id: number, domain: string }) => {
      try {
        const response = await fetch('/api/get-ranked-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            domain: competitor.domain,
            competitor_id: competitor.id.toString(),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch competitor rankings')
        }

        const data = await response.json()
        toast({
          title: "Success",
          description: `Rankings data updated for ${competitor.domain}`,
        })
      } catch (error) {
        console.error('Error fetching competitor rankings:', error)
        toast({
          title: "Error",
          description: `Failed to update rankings for ${competitor.domain}`,
          variant: "destructive",
        })
      }
    }
  
    const handleSubmitCompetitors = async () => {
      setIsSubmitting(true);
      try {
        const validCompetitors = newCompetitors.filter(c => c.trim() !== '');
        const errors: string[] = [];
        let hasError = false;
    
        for (let i = 0; i < validCompetitors.length; i++) {
          if (!validateUrl(validCompetitors[i])) {
            errors[i] = 'Please enter a valid URL';
            hasError = true;
          } else {
            errors[i] = '';
          }
        }
    
        if (hasError) {
          setInputErrors(errors);
          setIsSubmitting(false);
          return;
        }
    
        const normalizedCompetitors = validCompetitors.map(normalizeUrl);
    
        for (const competitor of normalizedCompetitors) {
          const { data, error } = await supabase
            .from('competitors')
            .insert({ user_id: user.id, domain: competitor })
            .select()
            .single();
  
          if (error) {
            console.error('Error adding competitor:', error);
            throw error;
          } else {
            // Fetch rankings data for the new competitor
            await fetchCompetitorRankings(data);
          }
        }
    
        await fetchCompetitors();
        setNewCompetitors(['']);
        setOnboardingStep(2);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add competitors. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const handleNextStep = () => {
      if (onboardingStep === 1) {
        handleSubmitCompetitors();
      } else if (onboardingStep < onboardingSteps.length - 1) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        setShowOnboarding(false);
      }
    };

    // Add a function to update rankings for all competitors
    const updateAllCompetitorRankings = async () => {
      for (const competitor of competitors) {
        await fetchCompetitorRankings(competitor)
      }
    }

  return (
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Competitor Overview</h1>
        <button onClick={handleAddCompetitor} className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
          Add Competitor
        </button>
      </div>

      <CompetitorOverview 
      ref={competitorOverviewRef}
      onRefreshRequest={handleRefreshRequest}
      user={user} />
      
      {competitors.length === 0 ? (
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8 mt-4">
        <p className="text-gray-600">No competitors added yet. Please add some using the form above.</p>
      </div>
      ) : (
        <>
          <div className='mt-8'>
            {competitors.length > 0 && (
              <>
                <CompetitorKeywordList 
                  competitors={competitors} // Now the types match
              />
              </>
            )}
          </div>
        </>
      )}

      <Transition appear show={showOnboarding} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowOnboarding(false)}>
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

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
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
                  <div className="absolute top-0 right-0 pt-4 pr-4 z-40">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400  hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setShowOnboarding(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="relative bg-gray-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-8">
                      <div className="mx-auto max-w-2xl py-8 sm:py-16 lg:max-w-none lg:py-64">
                        <div className="lg:pr-16">
                          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
                            {onboardingSteps[onboardingStep].title}
                          </h1>
                          <p className="mt-4 text-xl text-gray-600">
                            {onboardingSteps[onboardingStep].content}
                          </p>
                          {onboardingStep === 1 && (
                            <div className="mt-6">
                              {newCompetitors.map((competitor, index) => (
                                <div key={index} >
                                    <div className="mb-4 flex items-center">
                                  <input
                                    type="text"
                                    value={competitor}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    placeholder={`Enter competitor ${index + 1} domain`}
                                    className={`flex-grow px-3 py-2 border rounded-md ${
                                      inputErrors[index] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                  />
                                  {index > 0 && (
                                    <button
                                      onClick={() => handleRemoveInput(index)}
                                      className="ml-2 inline-flex items-center p-2 border border-transparent rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <TrashIcon className="h-5 w-5" />
                                    </button>
                                  )}
                                  </div>
                                    {inputErrors[index] && (
                                        <p className="-mt-2 mb-2 text-sm text-red-600">{inputErrors[index]}</p>
                                    )}
                                </div>
                              ))}
                              {newCompetitors.length < 3 && (
                                <button
                                  onClick={handleAddInput}
                                  className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <PlusIcon className="h-5 w-5 mr-2" />
                                  Add another competitor
                                </button>
                              )}
                            </div>
                          )}
                          <div className="mt-6">
                            <button
                              onClick={handleNextStep}
                              disabled={isSubmitting}
                              className={`inline-block rounded-md border border-transparent px-8 py-3 font-medium text-white 
                                ${isSubmitting 
                                  ? 'bg-indigo-400 cursor-not-allowed' 
                                  : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                              {isSubmitting 
                                ? <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Adding competitors...
                                  </span>
                                : onboardingStep < onboardingSteps.length - 1 
                                  ? "Next" 
                                  : "Start analyzing competitors"
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-48 w-full sm:h-64 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-1/2">
                    <img
                      alt=""
                      src="/competitor-image.webp"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {competitors.length > 0 && (
        <div className="mt-4">
          <button
            onClick={updateAllCompetitorRankings}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update All Rankings
          </button>
        </div>
      )}
    </div>
  );
}
