import DashboardContent from '@/components/DashboardContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from '../authenticated-layout';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';

export default async function WelcomePage() {
  const supabase = createServerComponentClient({ cookies });

  const [subscription, products, user] = await Promise.all([
    getSubscription(supabase),
    getProducts(supabase),
    getUser(supabase)
  ]);

  
  if (!user) {
    redirect('/signin');
  }

  const { data: latestCrawl } = await supabase
    .from('seo_crawls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isSeoCrawlComplete = latestCrawl && latestCrawl.status === 'completed';

  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} >
        <DashboardContent
        user={user}
        isSeoCrawlComplete={isSeoCrawlComplete}
        />
    </AuthenticatedLayout>
  );
}
