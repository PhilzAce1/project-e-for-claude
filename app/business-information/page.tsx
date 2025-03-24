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

    // Get the current website from the session
    const { data: { session } } = await supabase.auth.getSession();
    const { data: currentWebsite } = await supabase
        .from('business_information')
        .select('*')
        .eq('id', user?.user_metadata?.selected_business_id)
        .single();

    if (!currentWebsite) {
        redirect('/');
    }

    // Fetch the most recent analysis for this business
    const { data: latestAnalysis, error } = await supabase
        .from('business_analyses')
        .select('id')
        .eq('business_id', currentWebsite.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    // if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    //     // console.error('Error fetching analysis:', error);
    // }

    return (
        <AuthenticatedLayout user={user} products={products} subscription={subscription}>
            {latestAnalysis && (
                <BusinessAnalysis analysisId={latestAnalysis.id} />
            )}
        </AuthenticatedLayout>
    );
}
