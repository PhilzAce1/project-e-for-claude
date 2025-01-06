import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import YourContentContent from './YourContentContent';

export default async function YourContentPage() {
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
    <AuthenticatedLayout user={user} products={products} subscription={subscription}>
      <YourContentContent user={user} />
    </AuthenticatedLayout>
  );
} 