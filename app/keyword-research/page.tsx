import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import KeywordResearchContent from './KeywordResearchContent';
import AuthenticatedLayout from '../authenticated-layout';
import { getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';

export default async function KeywordResearchPage() {
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
            <KeywordResearchContent 
                user={user} 
            />
        </AuthenticatedLayout>
    );
} 