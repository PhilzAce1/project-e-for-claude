import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import OpportunitiesContent from './OpportunitiesContent';

export default async function OpportunitiesPage() {
    const supabase = createClient();
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
