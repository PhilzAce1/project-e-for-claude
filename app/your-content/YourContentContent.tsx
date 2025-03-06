'use client';

import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { UrlModal } from '@/components/ui/UrlModal';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';

interface YourContentContentProps {
  user: User;
}

interface Content {
  id: string;
  created_at: string;
  url: string;
  target_keyword: string;
  secondary_keywords: string[];
  title: string;
  status: string;
  site_indexed: boolean;
}

export default function YourContentContent({ user }: YourContentContentProps) {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchContent() {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // console.error('Error fetching content:', error);
        return;
      }

      setContent(data || []);
      setLoading(false);
    }

    fetchContent();

    const channel = supabase
      .channel('content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setContent(prev => [payload.new as Content, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, user.id]);

  const handleContentSubmit = async (url: string, title: string) => {
    try {
      const { data, error } = await supabase
        .from('content')
        .insert({ 
          user_id: user.id,
          url: url,
          title: title,
          status: 'published',
          site_indexed: false
        })
        .select()
        .single();

      if (error) {
        // console.error('Error inserting content:', error);
        throw error;
      }

      // Add the new content to the start of the list
      setContent(prev => [data, ...prev]);
      setIsModalOpen(false);

      const indexResponse = await fetch('/api/index-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          contentId: data[0].id
        })
      });

      if (!indexResponse.ok) {
        // console.error('Failed to index site:', await indexResponse.text());
      }
    } catch (error) {
      // console.error('Error submitting content:', error);
      throw error;
    }
  };

  const handleRemoveContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)
        .eq('user_id', user.id);

      if (error) {
        // console.error('Error removing content:', error);
        throw error;
      }

      // Remove the content from the local state
      setContent(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      // console.error('Error removing content:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <UrlModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        onSubmit={handleContentSubmit}
      />

      <div className="container mx-auto">
        <div className="overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Your Content
              </h1>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h2 className="text-lg font-bold">What is this?</h2>
                <p className="text-sm text-gray-600 mb-2 w-2/3">
                  When you publish content, we index it and add it to your content library.
                </p>
                <p className="text-sm text-gray-600">
                  You can then use this content to create backlinks for your site.
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto mb-8 relative">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                }}
                className="ml-3 inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                Submit Content
              </button>
            </div>
          <table className="min-w-full divide-y divide-gray-300 text-center">
            <thead>
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                  Title
                </th>
                <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                  URL
                </th>
                <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                  Indexed
                </th>
                <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {content.map((item) => (
                <tr key={item.id} className="even:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                    {item.title}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                        View Content
                      </a>
                    ) : (
                      <span className="text-gray-500">Not submitted</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      item.status === 'published' 
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                        : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                      item.site_indexed 
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' 
                        : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    }`}>
                      {item.site_indexed ? 'Indexed' : 'Pending'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-3">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="flex items-center rounded-full bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                          <span className="sr-only">Open options</span>
                          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleRemoveContent(item.id)}
                                  className={`
                                    ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                    group flex w-full items-center px-4 py-2 text-sm
                                  `}
                                >
                                  Remove
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {content.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No content added yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 