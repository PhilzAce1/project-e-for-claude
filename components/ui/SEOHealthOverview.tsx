interface SEOHealthOverviewProps {
  seoAudit: {
    onpage_score: string;
    lighthouse_data: {
      categories: {
        performance: { score: number };
        accessibility: { score: number };
        'best-practices': { score: number };
        seo: { score: number };
      };
    };
    page_metrics: {
      checks: Record<string, number>;
      non_indexable: number;
    };
    total_pages: number;
  }
}

function getScoreColor(score: number): string {
  if (score >= 86) return 'text-green-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBGColor(score: number): string {
  if (score >= 86) return 'bg-green-50';
  if (score >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

export function SEOHealthOverview({ seoAudit }: SEOHealthOverviewProps) {
  const { onpage_score, lighthouse_data, page_metrics, total_pages } = seoAudit;
  
  const lighthouseStats = [
    { id: 1, name: 'Performance', value: lighthouse_data.categories.performance.score * 100 },
    { id: 2, name: 'Accessibility', value: lighthouse_data.categories.accessibility.score * 100 },
    { id: 3, name: 'Best Practices', value: lighthouse_data.categories['best-practices'].score * 100 },
    { id: 4, name: 'SEO', value: lighthouse_data.categories.seo.score * 100},
  ]

  const pageStatus = {
    successful: total_pages - (page_metrics?.checks?.is_broken || 0) - 
                (page_metrics?.checks?.is_4xx_code || 0) - 
                (page_metrics?.checks?.is_5xx_code || 0) - 
                (page_metrics?.checks?.is_redirect || 0),
    redirects: page_metrics?.checks?.is_redirect || 0,
    broken: (page_metrics?.checks?.is_broken || 0) + 
            (page_metrics?.checks?.is_4xx_code || 0) + 
            (page_metrics?.checks?.is_5xx_code || 0),
    blocked: page_metrics?.non_indexable || 0
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Overall Score */}
      <div className="relative overflow-hidden rounded-xl shadow ring-1 ring-slate-900/10 bg-white p-6 text-center content-center">
        <h3 className="text-sm font-medium text-gray-900">Overall OnPage SEO Score</h3>
        <div className={`mt-2 inline-flex items-baseline rounded-xl p-2 ${getScoreBGColor(parseInt(onpage_score))}`}>
          <span className={`text-4xl font-semibold ${getScoreColor(parseInt(onpage_score))}`}>
            {parseInt(onpage_score)}
          </span>
        </div>
      </div>

      {/* Page Status */}
      <div className="relative overflow-hidden rounded-xl shadow ring-1 ring-slate-900/10 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-900">Page Status</h3>
        <ul className="mt-4 space-y-2">
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Successful: <strong>{pageStatus.successful}</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 bg-teal-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Redirects: <strong>{pageStatus.redirects}</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 bg-orange-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Broken: <strong>{pageStatus.broken}</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 bg-red-500 rounded-full" />
            <span className="text-sm text-gray-600">
              Blocked: <strong>{pageStatus.blocked}</strong>
            </span>
          </li>
        </ul>
      </div>

      {/* Lighthouse Scores */}
      <div className="relative overflow-hidden rounded-xl shadow ring-1 ring-slate-900/10 bg-white p-6 md:col-span-2">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {lighthouseStats.map((stat) => (
            <div key={stat.id} className="text-center">
              <div className={`inline-block rounded-lg p-3 ${getScoreBGColor(stat.value)}`}>
                <span className={`text-2xl font-semibold ${getScoreColor(stat.value)}`}>
                  {Math.round(stat.value)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{stat.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
