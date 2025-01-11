'use client';

import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

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
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchContent() {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching content:', error);
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
      <div className="container mx-auto">
        <div className="overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
          <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Your Content
          </h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            A list of all your published content and their target keywords.
          </p>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto mb-8">
        <table className="min-w-full divide-y divide-gray-300 text-center">
          <thead>
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-3">
                Title
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                Target Keyword
              </th>
              <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                Secondary Keywords
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
            </tr>
          </thead>
          <tbody className="bg-white">
            {content.map((item) => (
              <tr key={item.id} className="even:bg-gray-50">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
                  {item.title}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {item.target_keyword}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {item.secondary_keywords.join(', ')}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
                    View Content
                  </a>
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
    </>
  );
} 