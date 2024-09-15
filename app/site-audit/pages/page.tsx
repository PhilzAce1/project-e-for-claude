import { getUserDetails } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthenticatedLayout from '../../authenticated-layout';
import { siteAuditDictionary } from '@/utils/helpers/site-audit-dictionary';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default async function SiteAuditIssuesPage() {
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

  if (!user) {
    return <div>Please sign in to view your site audit.</div>;
  }

  if (!seoCrawlData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="mt-4 text-gray-600">You haven't started your site audit yet.</p>
      </div>
    );
  }

  const { scraped_pages } = seoCrawlData;
  console.log('Scraped Pages:', scraped_pages);

  const breadcrumbPages = [
    { name: 'Site Audit', href: '/site-audit', current: false },
    { name: 'Pages', href: '/site-audit/pages', current: true },
  ];

  return (
    <AuthenticatedLayout user={user} userDetails={userDetails}>
      <div className="container mx-auto">
            <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Pages Crawled: {scraped_pages.length}
                </h1>
            </div>
        <Breadcrumbs pages={breadcrumbPages} />
        <div className="mt-8 overflow-hidden rounded-2xl ring-slate-900/10 ring-1">
          <div className="flex flex-col bg-white px-8 py-4 relative">
            <ul className='divide-y divide-gray-200'>
              {scraped_pages.map((value: { url: string; status_code: number }) => (
                <li  className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0 flex justify-between items-center'>
                  <a href={value.url} className='text-orange-600 hover:text-orange-500'>{value.url}</a>
                  <span className='p-2 bg-gray-50 '>{value.status_code}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
