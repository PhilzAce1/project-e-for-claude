import AuthenticatedLayout from '../authenticated-layout';
import { redirect } from 'next/navigation';
import CompetitorsContent from './CompetitorsContent';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function CompetitorsPage() {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
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
