import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  getUserDetails,
  getSubscriptions,
  getProducts,
  getUser
} from '@/utils/supabase/queries';
import AccountContent from '@/components/AccountContent';
import AuthenticatedLayout from '../authenticated-layout';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function AccountPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscriptions(supabase)
  ]);

  const userId = user?.id as string;

  const [userDetails] = await Promise.all([
    getUserDetails(supabase, userId),
  ]);

  if (!user) {
    redirect('/signin/password_signin');
  }


  return (
    <AuthenticatedLayout subscription={subscription} products={products}  user={user} disableGateway={true}>
      <AccountContent user={user} userDetails={userDetails} subscription={subscription} />
    </AuthenticatedLayout>
  );
}
