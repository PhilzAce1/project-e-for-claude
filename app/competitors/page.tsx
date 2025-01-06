import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import CompetitorsContent from './CompetitorsContent';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';

export default async function CompetitorsPage() {
    const supabase = await createClient();
    const [user, products, subscription] = await Promise.all([
      getUser(supabase),
      getProducts(supabase),
      getSubscription(supabase)
    ]);
  
    if (!user) {
      redirect('/signin/password_signin');
    }

  return (
    <AuthenticatedLayout user={user} products={products} subscription={subscription} disableGateway={true}>
      <CompetitorsContent user={user} />
    </AuthenticatedLayout>
  );
}
