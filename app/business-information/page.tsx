import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BusinessAnalysis } from '../../components/BusinessInformation';
import AuthenticatedLayout from '../authenticated-layout';
import { getProducts, getSubscriptions, getUser } from '@/utils/supabase/queries';

export default async function BusinessInformationPage() {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
    
    const [user, products, subscription] = await Promise.all([
      getUser(supabase),
      getProducts(supabase),
      getSubscriptions(supabase)
    ]);

    if (!user) {
        redirect('/signin/password_signin');
    }

    // Fetch the most recent analysis for this user
    const { data: latestAnalysis, error } = await supabase
        .from('business_analyses')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    // if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    //     // console.error('Error fetching analysis:', error);
    // }

    return (
        <AuthenticatedLayout user={user} products={products} subscription={subscription} disableGateway={true}>
            {latestAnalysis && (
                <BusinessAnalysis analysisId={latestAnalysis.id} />
            )}
        </AuthenticatedLayout>
    );
}
