import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getSubscription, getLatestSeoCrawl, getProducts } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [subscription, isSeoCrawlComplete, products] = await Promise.all([
    getSubscription(supabase),
    getLatestSeoCrawl(supabase, user.id),
    getProducts(supabase)
  ]);

  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} >
      <DashboardContent user={user} isSeoCrawlComplete={isSeoCrawlComplete} />
    </AuthenticatedLayout>
  );
}
