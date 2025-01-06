import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getSubscription, getLatestSeoCrawl, getProducts, getKeywordRankings } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [subscription, products, keywordRankings] = await Promise.all([
    getSubscription(supabase),
    getProducts(supabase),
    getKeywordRankings(supabase, user.id)
  ]);

  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} >
      <DashboardContent user={user} keywordRankings={keywordRankings} />
    </AuthenticatedLayout>
  );
}
