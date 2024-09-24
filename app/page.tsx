import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getUserDetails, getSubscription, getLatestSeoCrawl } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin/password_signin');
  }

  const [userDetails, subscription, isSeoCrawlComplete] = await Promise.all([
    getUserDetails(supabase, user.id),
    getSubscription(supabase),
    getLatestSeoCrawl(supabase, user.id)
  ]);

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
      <DashboardContent user={user} userDetails={userDetails} isSeoCrawlComplete={isSeoCrawlComplete} />
    </AuthenticatedLayout>
  );
}
