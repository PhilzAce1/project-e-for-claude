import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon, 
  SparklesIcon,
  MagnifyingGlassIcon,
  HeartIcon
} from '@heroicons/react/20/solid'
import { useState, useEffect, useMemo } from 'react'
import { EnvelopeOpenIcon, CursorArrowRaysIcon } from "@heroicons/react/24/outline"
import { UsersIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { SEOHealthOverview } from './SEOHealthOverview'
import { SEOIssuesList } from './SEOIssuesList'
import { siteAutitPriority } from '@/utils/helpers/site-audit-dictionary'
import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ReactECharts from 'echarts-for-react'
import CompetitorOverview from './CompetitorOverview'

const tabs = [
  { 
    name: 'Keyword Rankings', 
    value: 'rankings',
    icon: ChartBarIcon, 
    current: true 
  },
  { 
    name: 'Opportunities', 
    value: 'opportunities',
    icon: SparklesIcon, 
    current: false 
  },
  { 
    name: 'Competitor Analysis', 
    value: 'competitors',
    icon: UserGroupIcon, 
    current: false 
  },
  { 
    name: 'SEO Audit', 
    value: 'audit',
    icon: ClipboardDocumentCheckIcon, 
    current: false 
  },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface SEOOverviewProps {
  user: User
  keywordRankings: any[]
  seoAudit: any
  keywordSuggestions: any[]
}

interface KeywordData {
  keyword: string;
}

interface CompetitorOverlap {
  se_type: string;
  keyword_data: KeywordData;
  ranked_serp_element: {
    serp_item: {
      rank_absolute: number;
    }
  };
}

const CompetitorOverlapChart = ({ data }: { data: any[] }) => {
  const option = {
    legend: {
      // Try 'horizontal'
      orient: 'vertical',
      left: 10,
      top: 'center'
    },
    series: [
      {
        name: 'Keyword Rankings',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold',
            formatter: '{b}\n{c}\n({d}%)'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name
        }))
      }
    ]
  }

  return <ReactECharts option={option} className='h-96'  />
}

const RankingDistributionChart = ({ data }: { data: any[] }) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.position),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    legend: {
      // Try 'horizontal'
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: 'Keywords',
        type: 'bar',
        barWidth: '60%',
        data: data.map(item => item.count)
      }
    ]
  }

  return <ReactECharts option={option} className='h-96'  />
}

export function SEOOverview({ 
  user, 
  keywordRankings, 
  seoAudit, 
  keywordSuggestions 
}: SEOOverviewProps) {
  const supabase = createClientComponentClient()
  const [currentTab, setCurrentTab] = useState('rankings')
  const [competitorData, setCompetitorData] = useState<any>(null)
  const [competitorOverlap, setCompetitorOverlap] = useState<any>(null)

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
    // Update tabs current state
    tabs.forEach(tab => tab.current = tab.value === value)
  }

  const calculateKeywordOverlap = (data: CompetitorOverlap[]): {
    totalKeywords: number;
    top10Keywords: number;
    top3Keywords: number;
    top1Keywords: number;
  } => {
    const result = {
      totalKeywords: 0,
      top10Keywords: 0,
      top3Keywords: 0,
      top1Keywords: 0
    };
  
    if (!data?.length) {
      return result;
    }
  
    // Count total keywords and positions
    data.forEach(item => {
      const rank = item?.ranked_serp_element?.serp_item.rank_absolute;
      
      if (rank) {
        result.totalKeywords++;
        
        if (rank <= 10) {
          result.top10Keywords++;
        }
        if (rank <= 3) {
          result.top3Keywords++;
        }
        if (rank === 1) {
          result.top1Keywords++;
        }
      }
    });
  
    return result;
  }
  
  const getCompetitorOverlap = (competitorData: any) => {
    if (!competitorData?.length) {
      return [];
    }
  
    const overlap = calculateKeywordOverlap(competitorData);
  
    return [
      {
        name: "Top 1 Rankings",
        value: overlap.top1Keywords
      },
      {
        name: "Top 2-3 Rankings", 
        value: overlap.top3Keywords - overlap.top1Keywords
      },
      {
        name: "Top 4-10 Rankings",
        value: overlap.top10Keywords - overlap.top3Keywords
      },
      {
        name: "Other Rankings",
        value: overlap.totalKeywords - overlap.top10Keywords
      }
    ];
  }

  useEffect(() => {
    async function fetchCompetitorData() {
      if (currentTab === 'competitors') {
        try {
          const { data: competitors, error } = await supabase
            .from('competitors')
            .select('domain, rankings_data')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching competitor data:', error);
            return;
          }

          let itemsArray: any[] = []

          competitors.forEach((competitor: any) => {
            itemsArray = [...itemsArray, ...competitor.rankings_data.items]
          })
          setCompetitorData(competitors);
          setCompetitorOverlap(getCompetitorOverlap(itemsArray))
        } catch (err) {
          console.error('Error in competitor data fetch:', err);
        }
      }
    }

    fetchCompetitorData();
  }, [currentTab, user.id, supabase]);

  const getRankingDistribution = (keywordRankings: any[]) => {
    const keys = ['pos_1',
        'pos_2_3',
        'pos_4_10',
        'pos_11_20',
        'pos_21_30',
        'pos_31_40',
        'pos_41_50',
        'pos_51_60',
        'pos_61_70',
        'pos_71_80',
        'pos_81_90',
        'pos_91_100']

    if (!keywordRankings) return []

    return keys?.map((key: any) => ({
        position: key.replace('pos_', '').replace('_', '-'),
        count: keywordRankings[key]
    }));
  };

  const calculateAveragePosition = (keywordRankings: any[]) => {
    if (!keywordRankings?.length) return 0;
    
    const totalPosition = keywordRankings.reduce((sum, item) => {
      return sum + item.ranked_serp_element.rank_absolute;
    }, 0);

    return Number((totalPosition / keywordRankings.length).toFixed(1));
  };  

  const getKeywordsInTop10 = (keywordRankings: any) => {
    if (!keywordRankings) return 0;
    
    return (
      keywordRankings.pos_1 +         // Position 1
      keywordRankings.pos_2_3 +       // Positions 2-3
      keywordRankings.pos_4_10        // Positions 4-10
    );
  };

  const calculateSEOHealthScore = (seoAudit: any) => {
    if (!seoAudit?.page_metrics?.checks) return 0;

    const checks = seoAudit.page_metrics.checks;
    const onPageScore = seoAudit.page_metrics.onpage_score || 0;
    const impactWeights = {
      high: 1.0,
      medium: 0.6,
      low: 0.3
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Calculate weighted score for each check
    Object.entries(checks).forEach(([checkKey, score]) => {
      // Find the priority info for this check
      const priorityInfo = siteAutitPriority.find(p => p.key === checkKey);
      
      if (priorityInfo && score !== null) {
        const weight = impactWeights[priorityInfo.impact as keyof typeof impactWeights];
        totalScore += (score as number) * weight;
        totalWeight += weight;
      }
    });

    // Calculate weighted average from checks
    const checksScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    
    // Combine checks score with onpage score (50/50 weight)
    const finalScore = (checksScore + onPageScore) / 2;

    // Return rounded score
    return Math.round(finalScore);
  };

  const stats = [
    { 
      id: 1, 
      name: 'Average Position', 
      stat: calculateAveragePosition(keywordRankings).toString(), 
      icon: ChartBarIcon, // Shows ranking/position concept
      change: '0', 
      changeType: '' 
    },
    { 
      id: 2, 
      name: 'Keywords in Top 10', 
      stat: getKeywordsInTop10(keywordRankings).toString(), 
      icon: MagnifyingGlassIcon, // Represents search/keywords
      change: '0', 
      changeType: '' 
    },
    { 
      id: 3, 
      name: 'SEO Health Score', 
      stat: `${calculateSEOHealthScore(seoAudit)}%`, 
      icon: HeartIcon, // Represents health/wellness
      change: '5%', 
      changeType: 'decrease' 
    },
  ]

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-xl shadow ring-1 ring-slate-900/10 bg-white px-4 py-5 sm:px-6 sm:py-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon aria-hidden="true" className="size-6 text-white" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline ">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={classNames(
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                  'ml-2 flex items-baseline text-sm font-semibold',
                )}
              >
                {item.changeType === 'increase' && (
                  <ArrowUpIcon aria-hidden="true" className="size-5 shrink-0 self-center text-green-500" />
                )}
                {item.changeType === 'decrease' && (
                  <ArrowDownIcon aria-hidden="true" className="size-5 shrink-0 self-center text-red-500" />
                )}

                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </p>
            </dd>
          </div>
        ))}
      </dl>

      {/* Tabs */}
      <div className='bg-white p-6 rounded-xl shadow ring-1 ring-slate-900/10'>
        <div>
        <div className="grid grid-cols-1 sm:hidden">
          <select
            value={currentTab}
            onChange={(e) => handleTabChange(e.target.value)}
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pl-3 pr-8 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          >
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.name}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
          />
        </div>

        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav aria-label="Tabs" className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={classNames(
                    tab.value === currentTab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                    'group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium'
                  )}
                >
                  <tab.icon
                    aria-hidden="true"
                    className={classNames(
                      tab.value === currentTab ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500',
                      '-ml-0.5 mr-2 size-5'
                    )}
                  />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mt-8">
        {currentTab === 'rankings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Keyword Ranking Distribution
              </h3>
              {keywordRankings ? (
                <RankingDistributionChart data={getRankingDistribution(keywordRankings)} />
              ) : (
                <div className="flex items-center justify-center h-96 border-dashed border border-gray-700 rounded-xl mt-4">
                  <div className="text-gray-500">No Keywords Ranking!</div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'competitors' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Competitor Keyword Overlap
            </h3>
            {competitorData ? (
              <CompetitorOverlapChart data={competitorOverlap} />
            ) : (
              <div className="flex items-center justify-center h-96 border-dashed border border-gray-700 rounded-xl mt-4">
                <div className="text-gray-500">Loading competitor data...</div>
              </div>
            )}

            <CompetitorOverview user={user} />
          </div>
        )}

        {currentTab === 'audit' && (
          <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">SEO Health Overview</h3>
                 {/* <SEOHealthBreakdown data={seoAudit} /> */}
                 <SEOHealthOverview seoAudit={seoAudit} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Critical Issues</h3>
                <SEOIssuesList seoAudit={seoAudit} maxIssues={4} />
              </div>
          </div>
        )}

        {currentTab === 'opportunities' && (
          <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Keyword Suggestions by Category</h3>
                {/* <KeywordSuggestionsList suggestions={keywordSuggestions} /> */}
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Content Opportunities</h3>
                    {/* <ContentOpportunities 
                    keywords={keywordSuggestions} 
                    competitors={competitorRankings} 
                    /> */}
              </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
