import { siteAuditDictionary, siteAutitPriority } from "@/utils/helpers/site-audit-dictionary";


interface SEOIssuesListProps {
  seoAudit: any;
  maxIssues?: number;
}

export const calculateTotalIssues = (page_metrics: any) => {
  const excludedChecks = ['is_https', 'has_meta_viewport', 'canonical', 'is_www', 'is_redirect'];
  
  return Object.entries(page_metrics?.checks || {} as Record<string, number>)
    .filter(([key, value]: [string, unknown]) => 
      typeof value === 'number' && 
      value > 0 && 
      !excludedChecks.includes(key)
    )
    .reduce((sum, [_, value]) => sum + (value as number), 0);
};

export function SEOIssuesList({ seoAudit, maxIssues = 4 }: SEOIssuesListProps) {
    const { page_metrics } = seoAudit;
    
    // Create a map of priorities for quick lookup
    const priorityMap = new Map(siteAutitPriority.map((item, index) => [item.key, index]));

    // Add this array of checks to exclude
    const excludedChecks = ['is_https', 'has_meta_viewport', 'canonical', 'is_www', 'is_redirect'];

    // Modify the filteredChecks definition
    const filteredChecks = Object.entries(page_metrics?.checks || {} as Record<string, number>)
        .filter(([key, value]: [string, unknown]) => typeof value === 'number' && value > 0 && !excludedChecks.includes(key))
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
        
    const totalIssues = calculateTotalIssues(page_metrics);

  return (
    <div className="relative overflow-hidden rounded-xl shadow ring-1 ring-slate-900/10 bg-white">
      <div className="p-6">
        <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">                        
          <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">SEO Issues Discovered</h2>
        </div>
        
        <p className="mt-4 text-3xl font-bold">
          {totalIssues}
        </p>
        
        <div className="border-b border-gray-200 mt-8 pb-5 sm:flex sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Top SEO Issues</h3>
        </div>

        <ul className='divide-y divide-gray-200'>
          {filteredChecks.slice(0, maxIssues).map(([key, value]) => (
            <li key={key} className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0'>
              <a href={`/site-audit/issues/${key}`} className='text-indigo-600 hover:text-indigo-500'>
                {String(value)} pages
              </a>
              {' '}
              {siteAuditDictionary[key as keyof typeof siteAuditDictionary] || `have an issue with ${key}`}
              <a href={`/site-audit/issues/${key}`} className='text-indigo-600 hover:text-indigo-500 float-right'>
                View Details
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-50 px-6 py-4 border-t text-sm">
        <a href="/site-audit/issues" className="font-medium text-indigo-600 hover:text-indigo-500">
          View All Issues
        </a>
      </div>
    </div>
  );
}
