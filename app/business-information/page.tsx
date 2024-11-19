import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BusinessAnalysis } from '../../components/BusinessInformation';
import AuthenticatedLayout from '../authenticated-layout';

export default async function BusinessInformationPage() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

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

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching analysis:', error);
    }

    return (
        <AuthenticatedLayout user={user}>
            {latestAnalysis ? (
                <BusinessAnalysis analysisId={latestAnalysis.id} />
            ) : (
                <div className="container mx-auto p-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-700">
                            No analysis found. Start by analyzing a business website.
                        </p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
