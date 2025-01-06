import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  getUserDetails,
  getSubscription,
  getProducts
} from '@/utils/supabase/queries';
import AccountContent from '@/components/AccountContent';
import AuthenticatedLayout from '../authenticated-layout';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userId = user?.id as string;

  const [userDetails, subscription, products] = await Promise.all([
    getUserDetails(supabase, userId),
    getSubscription(supabase),
    getProducts(supabase)
  ]);

  if (!user) {
    redirect('/signin/password_signin');
  }


  return (
    <AuthenticatedLayout subscription={subscription} products={products}  user={user} >
      <AccountContent user={user} userDetails={userDetails} subscription={subscription} />
    </AuthenticatedLayout>
  );
}
