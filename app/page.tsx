import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from './authenticated-layout';
import { getUserDetails, getSubscription } from '@/utils/supabase/queries';

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
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
          <p>Name: {userDetails?.full_name || 'Not set'}</p>
          <p>Email: {userDetails?.email}</p>
          <p>Subscription Status: {subscription?.status || 'No active subscription'}</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
