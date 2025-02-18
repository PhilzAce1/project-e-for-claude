import DashboardContent from '@/components/DashboardContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from '../authenticated-layout';
import { getKeywordRankings, getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';

export default async function WelcomePage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  const [subscription, products, keywordRankings] = await Promise.all([
    getSubscriptions(supabase),
    getProducts(supabase),
    getKeywordRankings(supabase, user?.id || '')
  ]);

  
  if (!user) {
    redirect('/signin');
  }

  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} >
      <DashboardContent user={user} keywordRankings={keywordRankings} />
    </AuthenticatedLayout>
  );
}
