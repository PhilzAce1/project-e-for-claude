import AuthenticatedLayout from '../authenticated-layout';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import OpportunitiesContent from './OpportunitiesContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function OpportunitiesPage() {
    const supabase = createServerComponentClient({ cookies });
    const [user, products, subscription] = await Promise.all([
      getUser(supabase),
      getProducts(supabase),
      getSubscription(supabase)
    ]);
  
    if (!user) {
      redirect('/signin/password_signin');
    }

  return (
    <AuthenticatedLayout user={user} products={products} subscription={subscription} disableGateway={false}>
      <OpportunitiesContent user={user} />
    </AuthenticatedLayout>
  );
}
