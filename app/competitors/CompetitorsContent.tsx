'use client';

import { Subscription, User } from '@supabase/supabase-js';
import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Pricing from '@/components/ui/Pricing/Pricing';

interface CompetitorsContentProps {
  user: User;
  products: Product[];
  subscription: Subscription;
}

export default function CompetitorsContent({ user, products, subscription }: CompetitorsContentProps) {
  const [competitors, setCompetitors] = useState<{ id: string, domain: string }[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputError, setInputError] = useState('');
  const supabase = createClientComponentClient();

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  async function fetchCompetitors() {
    const { data, error } = await supabase
      .from('competitors')
      .select('id, domain')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching competitors:', error);
    } else {
      setCompetitors(data);
      if (data.length === 0) {
        setShowOnboarding(true);
      }
    }
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
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

  const normalizeUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    const urlObj = new URL(url);
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.slice(4);
    }
    return urlObj.href;
  }

  const addCompetitor = async () => {
    if (newCompetitor.trim()) {
      if (validateUrl(newCompetitor)) {
        try {
          const normalizedUrl = normalizeUrl(newCompetitor.trim());
          
          if (competitors.length >= 3) {
            setInputError('You can only add up to 3 competitors. Upgrade to add more.');
            return;
          }

          const { data, error } = await supabase
            .from('competitors')
            .insert({ user_id: user.id, domain: normalizedUrl })
            .select()
            .single();

          if (error) {
            setInputError('Error adding competitor. Please try again.');
            console.error('Error adding competitor:', error);
          } else {
            setCompetitors([...competitors, { id: data.id, domain: data.url }]);
            setNewCompetitor('');
            setIsModalOpen(false);
            setInputError('');
          }
        } catch (error) {
          setInputError('Invalid URL format. Please enter a valid URL.');
        }
      } else {
        setInputError('Please enter a valid URL');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addCompetitor();
  };

  const onboardingSteps = [
    {
      title: "Welcome to Competitor Analysis!",
      content: "Let's get started by adding your top competitors. This will help us provide better insights for your SEO strategy.",
    },
    {
      title: "Add Your First Competitor",
      content: "Enter the domain of your first competitor. This should be a website that directly competes with your business in search results.",
    },
    {
      title: "Great Job!",
      content: "You've added your first competitor. Let's add two more to get a comprehensive view of your competitive landscape.",
    },
    {
      title: "Competitor Analysis Complete",
      content: "Excellent! You've added your top competitors. We'll now analyze their SEO strategies to help improve your rankings.",
    }
  ];

  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const handleAddCompetitor = async () => {
    await addCompetitor();
    if (competitors.length === 0) {
      handleNextStep();
    }
  };

  return (
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Your Competitors</h1>
        <button onClick={() => setIsModalOpen(true)} className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
          Add Competitor
        </button>
      </div>
      
      {competitors.length === 0 ? (
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8 mt-4">
        <p className="text-gray-600">No competitors added yet. Please add some using the form above.</p>
      </div>
      ) : (
        <>
          <div className='mt-8'>
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                id="competitors"
                name="competitors"
                defaultValue={competitors.find((competitor) => competitor)?.domain}
                className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              >
                {competitors.map((competitor) => (
                  <option key={competitor.domain}>{new URL(competitor.domain).hostname}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block">
              <nav aria-label="Tabs" className="isolate flex divide-x divide-gray-200 rounded-lg shadow">
                {competitors.map((competitor, competitorIdx) => (
                  <a
                    key={competitor.domain}
                    href={competitor.domain}
                    aria-current={competitor ? 'page' : undefined}
                    className={classNames(
                      competitor ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
                      competitorIdx === 0 ? 'rounded-l-lg' : '',
                      competitorIdx === competitors.length - 1 ? 'rounded-r-lg' : '',
                      'group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10',
                    )}
                  >
                    <span>{new URL(competitor.domain).hostname}</span>
                    <span
                      aria-hidden="true"
                      className={classNames(
                        competitor ? 'bg-indigo-500' : 'bg-transparent',
                        'absolute inset-x-0 bottom-0 h-0.5',
                      )}
                    />
                  </a>
                ))}
              </nav>
            </div>
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
                  <div className="relative bg-gray-100">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-8">
                      <div className="mx-auto max-w-2xl py-24 lg:max-w-none">
                        <div className="lg:pr-16">
                          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
                            {onboardingStep === 0 && "Welcome to Competitor Analysis!"}
                            {onboardingStep === 1 && "Add Your First Competitor"}
                            {onboardingStep === 2 && "Great Job!"}
                            {onboardingStep === 3 && "Competitor Analysis Complete"}
                          </h1>
                          <p className="mt-4 text-xl text-gray-600">
                            {onboardingStep === 0 && "Let's get started by adding your top competitors. This will help us provide better insights for your SEO strategy."}
                            {onboardingStep === 1 && "Enter the domain of your first competitor. This should be a website that directly competes with your business in search results."}
                            {onboardingStep === 2 && "You've added your first competitor. Let's add two more to get a comprehensive view of your competitive landscape."}
                            {onboardingStep === 3 && "Excellent! You've added your top competitors. We'll now analyze their SEO strategies to help improve your rankings."}
                          </p>
                          {(onboardingStep === 1 || onboardingStep === 2) && (
                            <div className="mt-6">
                              <input
                                type="text"
                                value={newCompetitor}
                                onChange={(e) => setNewCompetitor(e.target.value)}
                                placeholder="Enter competitor domain"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              />
                              <button
                                onClick={handleAddCompetitor}
                                className="mt-2 inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
                              >
                                Add Competitor
                              </button>
                            </div>
                          )}
                          <div className="mt-6">
                            <button
                              onClick={handleNextStep}
                              className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
                            >
                              {onboardingStep < 3 ? "Next" : "Start analyzing competitors"}
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

      <Pricing user={user} products={products} subscription={subscription} />
    </div>
  );
}