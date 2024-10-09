import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getSubscription, getLatestSeoCrawl } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [subscription, isSeoCrawlComplete] = await Promise.all([
    getSubscription(supabase),
    getLatestSeoCrawl(supabase, user.id)
  ]);

  return (
    <AuthenticatedLayout user={user} >
      <DashboardContent user={user} isSeoCrawlComplete={isSeoCrawlComplete} />
    </AuthenticatedLayout>
  );
}
