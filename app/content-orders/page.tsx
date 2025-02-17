import AuthenticatedLayout from '../authenticated-layout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';
import ContentOrdersContent from './ContentOrdersContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function ContentOrdersPage() {
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
      <ContentOrdersContent user={user} />
    </AuthenticatedLayout>
  );
} 