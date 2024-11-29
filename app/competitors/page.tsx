import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CompetitorsContent from './CompetitorsContent';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';

export default async function CompetitorsPage() {
    const supabase = createClient();
    const [user, products, subscription] = await Promise.all([
      getUser(supabase),
      getProducts(supabase),
      getSubscription(supabase)
    ]);
  
  console.log('user', products, subscription)
    if (!user) {
      redirect('/signin/password_signin');
    }

  return (
    <AuthenticatedLayout user={user} products={products} subscription={subscription}>
      <CompetitorsContent user={user} />
    </AuthenticatedLayout>
  );
}
