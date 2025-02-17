import AuthenticatedLayout from '@/app/authenticated-layout';
import { redirect } from 'next/navigation';
import { getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import CreateContentContent from './CreateContentContent';

export default async function CreateContentPage({ params }: { params: { keyword: string } }) {
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
      <CreateContentContent user={user} keyword={params.keyword} />
    </AuthenticatedLayout>
  );
} 