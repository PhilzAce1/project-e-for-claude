import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RankingsContent from './RankingsContent';
import AuthenticatedLayout from '../authenticated-layout';

export default async function RankingsPage() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/signin/password_signin');
    }

    // Fetch rankings data
    const { data: rankingsData, error } = await supabase
        .from('business_information')
        .select('rankings_data, rankings_updated_at')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching rankings data:', error);
    }

    return (
      <AuthenticatedLayout user={user}>
        <RankingsContent user={user} rankingsData={rankingsData?.rankings_data} lastCrawlDate={rankingsData.rankings_updated_at} />
        </AuthenticatedLayout>
    );
}
