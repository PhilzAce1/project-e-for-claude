import { getProducts, getSubscription, getUser, getUserDetails } from '@/utils/supabase/queries';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import AuthenticatedLayout from '../../authenticated-layout';
import { siteAuditDictionary, siteAutitPriority } from '@/utils/helpers/site-audit-dictionary';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

// Define the type for your audit items
type Audit = {
  // Add the properties of your audit object here
  id: number;
  domain: string;
  // ... other properties
};

export default async function SiteAuditIssuesPage() {
  const supabase = createServerComponentClient({ cookies });

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

const { page_metrics } = seoCrawlData;

// Create a map of priorities for quick lookup
const priorityMap = new Map(siteAutitPriority.map((item, index) => [item.key, index]));

// Add this array of checks to exclude
const excludedChecks = ['is_https', 'has_meta_viewport', 'canonical', 'is_www', 'is_redirect'];

// Modify the filteredChecks definition
const filteredChecks = Object.entries(page_metrics?.checks || {})
    .filter(([key, value]) => typeof value === 'number' && value > 0 && !excludedChecks.includes(key))
    .sort(([keyA, valueA], [keyB, valueB]) => {
        // First, sort by priority
        const priorityA = priorityMap.get(keyA) ?? Infinity;
        const priorityB = priorityMap.get(keyB) ?? Infinity;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        // If priority is the same, sort by number of affected pages
        return (valueB as number) - (valueA as number);
    });
    
const pages = [
  { name: 'Site Audit', href: '/site-audit', current: false },
  { name: 'Issues', href: '/site-audit/issues', current: true },
]

const totalIssues = filteredChecks.reduce((sum, [_, value]) => sum + (value as number), 0);
  return (
    <AuthenticatedLayout products={products} subscription={subscription} user={user} disableGateway={true}>
        
        <div className="container mx-auto">
            <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
                <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  SEO Issues Discovered - {totalIssues}
                </h1>
            </div>

            <Breadcrumbs pages={pages} />

            <div className="mt-8 overflow-hidden rounded-2xl  ring-slate-900/10 ring-1 ">
                  
                  <div className="flex flex-col bg-white p-8 ">
                    <ul className='divide-y divide-gray-200'>
                    {filteredChecks.map(([key, value]) => (
                        <li key={key} className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0'>
                            <a href={`/site-audit/issues/${key}`} className='text-orange-600 hover:text-orange-500'>
                                {String(value)} pages
                            </a>
                            {' '}
                            {siteAuditDictionary[key as keyof typeof siteAuditDictionary] || `have an issue with ${key}`}
                            <a href={`/site-audit/issues/${key}`}  className='text-orange-600 hover:text-orange-500 float-right'>View Details</a>
                        </li>
                    ))}
                    </ul>
                  </div>
            </div>
            
        </div>
    </AuthenticatedLayout>)
}
