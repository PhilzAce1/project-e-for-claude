import AuthenticatedLayout from '../authenticated-layout';
import { redirect } from 'next/navigation';
import { getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';
import YourContentContent from './YourContentContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function YourContentPage() {
  const supabase = createServerComponentClient({ cookies });
    const [user, products, subscription] = await Promise.all([
      getUser(supabase),
      getProducts(supabase),
      getSubscriptions(supabase)
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