import { getUserDetails } from '@/utils/supabase/queries';
import SiteAuditContent from './SiteAuditContent';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthenticatedLayout from '../authenticated-layout';

export default async function SiteAuditPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  let userDetails = null;
  let seoCrawlData = null;

  if (user) {
    userDetails = await getUserDetails(supabase, user.id);

    const { data, error } = await supabase
      .from('seo_crawls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching SEO crawl data:', error);
    } else {
      seoCrawlData = data;
    }
  }

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
        <SiteAuditContent user={user} seoCrawlData={seoCrawlData} />
    </AuthenticatedLayout>)
}
