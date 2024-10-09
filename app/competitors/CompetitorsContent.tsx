'use client';

import { User } from '@supabase/supabase-js';
import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CompetitorsContentProps {
  user: User;
}

export default function CompetitorsContent({ user }: CompetitorsContentProps) {
  const [competitors, setCompetitors] = useState<{ id: string, domain: string }[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputError, setInputError] = useState('');
  const supabase = createClientComponentClient();

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
      setCompetitors(data.map(comp => ({ ...comp, current: false })));
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

      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsModalOpen}>
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                  <div>
                    <div className="text-center">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Add New Competitor
                      </Dialog.Title>
                      <form onSubmit={handleSubmit} className="mt-2">
                        <label htmlFor="competitor-url" className="sr-only">
                          Competitor URL
                        </label>
                        <input
                          type="text"
                          id="competitor-url"
                          value={newCompetitor}
                          onChange={(e) => setNewCompetitor(e.target.value)}
                          placeholder="Enter competitor url (e.g. example.com)"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                        {inputError && <p className="mt-2 text-sm text-red-600" role="alert">{inputError}</p>}
                        <div className="mt-5 sm:mt-6 text-right">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            Add Competitor
                          </button>
                        </div>
                      </form>
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