
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getSubscription, getLatestSeoCrawl, getProducts, getKeywordRankings, getUser } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const user = await getUser(supabase);

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
