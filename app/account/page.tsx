import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  getUserDetails,
  getSubscription,
} from '@/utils/supabase/queries';
import AccountContent from '@/components/AccountContent';
import AuthenticatedLayout from '../authenticated-layout';

export default async function AccountPage() {
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
      <AccountContent user={user} userDetails={userDetails} subscription={subscription} />
    </AuthenticatedLayout>
  );
}
