import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import ContentOrdersContent from './ContentOrdersContent';

export default async function ContentOrdersPage() {
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
    <AuthenticatedLayout user={user} products={products} subscription={subscription}>
      <ContentOrdersContent user={user} />
    </AuthenticatedLayout>
  );
} 