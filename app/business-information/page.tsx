import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BusinessAnalysis } from '../../components/BusinessInformation';
import AuthenticatedLayout from '../authenticated-layout';
import ZeroStateHero from '@/components/ZeroStateHero';

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

    console.log(latestAnalysis)

    return (
        <AuthenticatedLayout user={user}>
            {latestAnalysis ? (
                <BusinessAnalysis analysisId={latestAnalysis.id} />
            ) : (
                
            <ZeroStateHero 
                title="Kickstart Your SEO Strategy Now!"
                subtitle="We need to start by learning about your business."
                description="Enter your domain below to begin."
                ctaText="Start Now"
                user={user}
                imageSrc="/rank-image.webp"
                fullPage={true}
            />
            )}
        </AuthenticatedLayout>
    );
}
