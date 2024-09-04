import { createClient } from '@/utils/supabase/server';
import {
  getUserDetails,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';
import AccountContent from '@/components/AccountContent';

export default async function AccountPage() {
  const supabase = createClient();
  const [user, userDetails, subscription] = await Promise.all([
    getUser(supabase),
    getUserDetails(supabase),
    getSubscription(supabase)
  ]);

  if (!user) {
    return null; // or redirect to login
  }

  return <AccountContent user={user} userDetails={userDetails} subscription={subscription} />;
}
