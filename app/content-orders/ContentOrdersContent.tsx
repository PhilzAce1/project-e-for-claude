'use client';

import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { useRouter } from 'next/navigation'

interface ContentOrdersContentProps {
  user: User;
}

interface ContentOrder {
  search_intent: string;
  competition_level: string;
  id: string;
  created_at: string;
  keyword: string;
  status: string;
  search_volume: number;
  competition: string;
  main_intent: string;
  content_upload: string;
  upload_instructions: string;
}

export default function ContentOrdersContent({ user }: ContentOrdersContentProps) {
  const [orders, setOrders] = useState<ContentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('content_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data || []);
      setLoading(false);
    }

    fetchOrders();

    // Subscribe to new orders
    const channel = supabase
      .channel('content_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as ContentOrder, ...prev]);
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
    <div className="container mx-auto">
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Content Orders
        </h1>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-visible shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead >
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
                    <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {order.keyword}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.search_volume.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                        {order.competition_level}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 capitalize">
                        {order.search_intent}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`capitalize inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${order.status === 'completed'
                                ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
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
                            <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      disabled={order.status !== 'completed'}
                                      onClick={() => router.push(`${order.content_upload}`)}
                                      className={`
                                        ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                        ${order.status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}
                                        group flex w-full items-center px-4 py-2 text-sm
                                      `}
                                    >
                                      View Content
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      disabled={order.status !== 'completed'}
                                      onClick={() => router.push(`${order.upload_instructions}`)}
                                      className={`
                                        ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                        ${order.status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}
                                        group flex w-full items-center px-4 py-2 text-sm
                                      `}
                                    >
                                      Upload Instructions
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 