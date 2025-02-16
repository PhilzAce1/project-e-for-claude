import AuthenticatedLayout from '@/app/authenticated-layout';
import { redirect } from 'next/navigation';
import { getProducts, getSubscription, getUser } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ContentPricing from '@/components/ui/ContentPricing';

export default async function ContentPricingPage({ params }: { params: { keyword: string } }) {
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
    <AuthenticatedLayout user={user} products={products} subscription={subscription}>
      <ContentPricing 
        user={user}
        products={products || []}
        subscription={subscription}
        keyword={decodeURIComponent(params.keyword)}
      />
    </AuthenticatedLayout>
  );
} 