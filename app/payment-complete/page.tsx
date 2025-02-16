import AuthenticatedLayout from '../authenticated-layout';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import PaymentCompleteContent from './PaymentCompleteContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function PaymentCompletePage() {
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
    <AuthenticatedLayout user={user} products={products || []} subscription={subscription}>
      <PaymentCompleteContent user={user} />
    </AuthenticatedLayout>
  );
} 