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
      const needsRefresh = !data.lighthouse_data && 
        !data.onpage_score &&
        new Date(data.created_at) < new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      if (needsRefresh && data) {
        // Ping for SEO data if external_job_id exists
        if (data.external_job_id) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/pageforseo/pingback?id=${data.external_job_id}`);
            if (!response.ok) {
              console.error('Error refreshing SEO data:', await response.text());
            } else {
              console.log('Successfully triggered SEO data refresh');
            }
          } catch (error) {
            console.error('Error calling SEO pingback endpoint:', error);
          }
        }

        // Ping for Lighthouse data if lighthouse_task_id exists
        if (data.lighthouse_task_id) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/pageforseo/pingback?id=${data.lighthouse_task_id}&tag=lighthouse_audit`);
            if (!response.ok) {
              console.error('Error refreshing Lighthouse data:', await response.text());
            } else {
              console.log('Successfully triggered Lighthouse data refresh');
            }
          } catch (error) {
            console.error('Error calling Lighthouse pingback endpoint:', error);
          }
        }
      }

      if (!needsRefresh) {
        console.log('SEO data does not need refresh');
        seoCrawlData = data;
      }
    }
  }

  return (
    <AuthenticatedLayout user={user} >
        <SiteAuditContent user={user} seoCrawlData={seoCrawlData} />
    </AuthenticatedLayout>)
}
