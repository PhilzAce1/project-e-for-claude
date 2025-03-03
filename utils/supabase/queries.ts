import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getSubscriptions = cache(async (supabase: SupabaseClient) => {
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))') 
    .in('status', ['trialing', 'active'])
    // .maybeSingle();

  console.log(subscriptions );

  return subscriptions;
});

export const getProducts = cache(async (supabase: SupabaseClient) => {
  const { data: products, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  return products;
});

export const getUserDetails = cache(async (supabase: SupabaseClient, userId: string) => {
  const { data: userDetails, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user details:', error);
    return null;
  }

  return userDetails;
});

export async function getLatestSeoCrawl(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('seo_crawls')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching SEO crawl data:', error);
    return false;
  }

  const requiredFields = [ 'lighthouse_data', 'total_pages', 'page_metrics', 'scraped_pages'];
  const isComplete = requiredFields.every(field => data && data[field] != null);
  return isComplete;
}

export const getKeywordRankings = cache(async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('business_information')
      .select('rankings_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching keyword rankings:', error);
      return null;
    }

    // If rankingsData exists, parse it (if it's stored as a JSON string)
    // or return it directly if it's already an object
    if (data?.rankings_data) {
      return typeof data.rankings_data === 'string' 
        ? JSON.parse(data.rankings_data) 
        : data.rankings_data;
    }

    return null;
  } catch (error) {
    console.error('Error in getKeywordRankings:', error);
    return null;
  }
});

export const getUserContent = cache(async (supabase: SupabaseClient, userId: string) => {
  try {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user domain links:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserContent:', error);
    return null;
  }
});