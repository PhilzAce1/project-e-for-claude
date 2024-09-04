import { createClient } from '@/utils/supabase/server';
import { getUserDetails, getSubscription } from '@/utils/supabase/queries';

export default async function Dashboard() {
  const supabase = createClient();
  const [userDetails, subscription] = await Promise.all([
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Your Dashboard</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Account Overview</h2>
        <p>Name: {userDetails?.full_name || 'Not set'}</p>
        <p>Email: {userDetails?.email}</p>
        <p>Subscription Status: {subscription?.status || 'No active subscription'}</p>
      </div>
      <div className="mt-4 p-4 bg-yellow-100 rounded">
        <p>Debug: Dashboard component rendered</p>
      </div>
    </div>
  );
}
