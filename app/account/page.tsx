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
    redirect('/signin/password_signin');
  }

  const userId = user?.id as string;

  const [userDetails, subscription] = await Promise.all([
    getUserDetails(supabase, userId),
    getSubscription(supabase)
  ]);

  return (
    <AuthenticatedLayout user={user} >
      <AccountContent user={user} userDetails={userDetails} subscription={subscription} />
    </AuthenticatedLayout>
  );
}
