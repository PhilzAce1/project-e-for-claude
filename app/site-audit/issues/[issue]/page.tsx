import { getProducts, getSubscription, getUser, getUserDetails } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthenticatedLayout from '../../../authenticated-layout';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { siteAuditDictionary, siteAuditIssueFixes, siteAuditUserFriendlyTitles } from '@/utils/helpers/site-audit-dictionary';

function removeDomain(url: string): string {
  try {
    const urlObject = new URL(url);
    return urlObject.pathname + urlObject.search + urlObject.hash;
  } catch (e) {
    return url; // Return original URL if it's invalid
  }
}

interface ScrapedPage {
  checks: {
    [key: string]: boolean;
  };
  // Add other properties of the page object if needed
}
type PageType = {
  url: string;
  // Add other properties that your page object might have
};

export default async function SiteAuditIssuesPage({
  params
}: any) {
  const supabase = createServerComponentClient({ cookies });
  const issue = params.issue;
  let seoCrawlData = null;
  
  const [subscription, products, user] = await Promise.all([
    getSubscription(supabase),
    getProducts(supabase),
    getUser(supabase)
  ]);

  if (user) {

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

  // Filter pages based on the issue
  const filteredPages = scraped_pages?.filter((page: ScrapedPage) => page.checks[issue] === true);

  const breadcrumbPages = [
    { name: 'Site Audit', href: '/site-audit', current: false },
    { name: 'Issues', href: '/site-audit/issues', current: false },
    { name: siteAuditUserFriendlyTitles[issue] || issue, href: '#', current: true },
  ];

  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} disableGateway={true}>
      <div className="container mx-auto">
        <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
          <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Affected Pages: {filteredPages?.length || 0}
          </h1>
        </div>
        <Breadcrumbs pages={breadcrumbPages} />
        <div className="mt-8 overflow-hidden rounded-2xl grid grid-cols-1 gap-0.5 ring-slate-900/10 ring-1  sm:grid-cols-2 lg:grid-cols-2 ">
          <div className="flex flex-col bg-white px-8 py-4 relative">
            <div className="border-b mt-3 border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold leading-6 text-gray-900">Issue: { siteAuditUserFriendlyTitles[issue] }</h2>
            </div>
              <div className="mt-4 border-gray-200 pb-5">
                  <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">How to fix the issue:</h3>
                  <p className='mb-4'>{siteAuditIssueFixes[issue].how_to_fix}</p>
                  <p><a href={siteAuditIssueFixes[issue].learn_more} className='flex w-full justify-center rounded-md bg-orange-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' target='_blank'>Learn more</a></p>
              </div>
          </div>
          <div className="flex flex-col bg-white px-8 py-4">
            <ul className='divide-y divide-gray-200'>
              {filteredPages?.map((page: PageType, index: number) => (
                <li key={index} className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0 flex justify-between items-center'>
                  <a href={page.url} className='text-orange-600 hover:text-orange-500' target='_blank'>{removeDomain(page.url)}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
