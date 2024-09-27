import DashboardContent from '@/components/DashboardContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AuthenticatedLayout from '../authenticated-layout';

export default async function WelcomePage() {
  const supabase = createServerComponentClient({ cookies });
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  const { data: userDetails } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: latestCrawl } = await supabase
    .from('seo_crawls')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isSeoCrawlComplete = latestCrawl && latestCrawl.status === 'completed';

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
        <DashboardContent
        user={user}
        userDetails={userDetails}
        isSeoCrawlComplete={isSeoCrawlComplete}
        />
    </AuthenticatedLayout>
  );
}
