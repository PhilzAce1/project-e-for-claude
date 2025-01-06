'use client';

import { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';

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
}

export default function ContentOrdersContent({ user }: ContentOrdersContentProps) {
  const [orders, setOrders] = useState<ContentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

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
    <><div className="container mx-auto">
          <div className=" overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
              <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Content Orders</h1>
              <p className="mt-2 max-w-4xl text-sm text-gray-500">
                  A list of all your content orders and their current status.
              </p>
          </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 rounded-lg bg-white shadow mt-8 overflow-x-auto mb-8">
      <table className="min-w-full divide-y divide-gray-300 text-center">
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
                                  </tr>
                              </thead>
                              <tbody className="bg-white">
                                  {orders.map((order) => (
                                      <tr key={order.id} className="even:bg-gray-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-3 text-left">
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
                                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${order.status === 'completed'
                                                      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                                      : 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'}`}>
                                                  {order.status}
                                              </span>
                                          </td>
                                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                              {new Date(order.created_at).toLocaleDateString()}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          {orders.length === 0 && (
                              <div className="text-center py-8">
                                  <p className="text-sm text-gray-500">No content orders yet.</p>
                              </div>
                          )}
                      </div>
          </>

  );
} 