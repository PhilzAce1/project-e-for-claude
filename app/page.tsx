import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getUserDetails, getSubscription } from '@/utils/supabase/queries';
import DashboardContent from '@/components/DashboardContent';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const [userDetails, subscription] = await Promise.all([
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
      <DashboardContent  user={user} userDetails={userDetails} />
    </AuthenticatedLayout>
  );
}
