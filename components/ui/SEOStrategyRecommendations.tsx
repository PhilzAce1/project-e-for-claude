import React from 'react';
import { Rankings } from '../../utils/helpers/ranking-data-types';
import generateRankingsSummary, { RankingSummary } from '../../utils/helpers/ranking-summary';
import { OnPageSEOAudit } from '../../utils/helpers/onpage-seo-types'; // Assume this type exists

interface SEOStrategyRecommendationsProps {
  competitorsRankings: Rankings[];
  clientRankings: Rankings;
  onPageSEOAudit: OnPageSEOAudit;
}

const SEOStrategyRecommendations: React.FC<SEOStrategyRecommendationsProps> = ({
  competitorsRankings,
  clientRankings,
  onPageSEOAudit
}) => {
  const competitorsSummaries = competitorsRankings.map(rankings => generateRankingsSummary(rankings));
  const clientSummary = generateRankingsSummary(clientRankings);

  const recommendations: string[] = [];

  // Aggregate competitor data
  const aggregatedCompetitorSummary = aggregateCompetitorSummaries(competitorsSummaries);

  // Compare keyword coverage
  const avgCompetitorKeywords = Math.round(aggregatedCompetitorSummary.totalKeywords / competitorsSummaries.length);
  const keywordGap = avgCompetitorKeywords - clientSummary.totalKeywords;
  if (keywordGap > 0) {
    recommendations.push(`Expand keyword coverage: Target approximately ${keywordGap} more keywords to match the average competitor's range.`);
  }

  // Analyze ranking distribution
  Object.entries(aggregatedCompetitorSummary.rankingDistribution).forEach(([range, count]) => {
    const avgCompetitorCount = Math.round(count / competitorsSummaries.length);
    const clientCount = clientSummary.rankingDistribution[range] || 0;
    if (avgCompetitorCount > clientCount) {
      recommendations.push(`Improve rankings in ${range} range: Average competitor has ${avgCompetitorCount - clientCount} more keywords in this range.`);
    }
  });

  // Compare top keywords
  const competitorTopKeywords = new Set(aggregatedCompetitorSummary.topKeywords.map(k => k.keyword));
  const clientTopKeywords = new Set(clientSummary.topKeywords.map(k => k.keyword));
  const missingTopKeywords = [...competitorTopKeywords].filter(x => !clientTopKeywords.has(x));
  if (missingTopKeywords.length > 0) {
    recommendations.push(`Target these high-value keywords that competitors are ranking for: ${missingTopKeywords.join(', ')}`);
  }

  // Analyze search intent distribution
  Object.entries(aggregatedCompetitorSummary.searchIntentDistribution).forEach(([intent, count]) => {
    const avgCompetitorCount = Math.round(count / competitorsSummaries.length);
    const clientCount = clientSummary.searchIntentDistribution[intent] || 0;
    if (avgCompetitorCount > clientCount) {
      recommendations.push(`Create more content for ${intent} intent: Average competitor has ${avgCompetitorCount - clientCount} more keywords with this intent.`);
    }
  });

  // Incorporate on-page SEO audit results
  if (onPageSEOAudit.missingMetaTags > 0) {
    recommendations.push(`Add missing meta tags to ${onPageSEOAudit.missingMetaTags} pages to improve on-page SEO.`);
  }
  if (onPageSEOAudit.slowLoadingPages > 0) {
    recommendations.push(`Optimize ${onPageSEOAudit.slowLoadingPages} slow-loading pages to improve user experience and SEO.`);
  }
  // Add more recommendations based on other on-page SEO audit results

  return (
    <div className="seo-strategy-recommendations">
      <h2>SEO Strategy Recommendations</h2>
      <ul>
        {recommendations.map((recommendation, index) => (
          <li key={index}>{recommendation}</li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to aggregate competitor summaries
function aggregateCompetitorSummaries(summaries: RankingSummary[]): RankingSummary {
  return summaries.reduce((acc, summary) => {
    acc.totalKeywords += summary.totalKeywords;
    acc.totalETV += summary.totalETV;
    acc.averageBacklinks += summary.averageBacklinks;

    // Aggregate distributions and arrays
    ['rankingDistribution', 'keywordDifficultyDistribution', 'searchIntentDistribution', 'serpFeatureDistribution'].forEach(key => {
      Object.entries(summary[key]).forEach(([k, v]) => {
        acc[key][k] = (acc[key][k] || 0) + v;
      });
    });

    ['topKeywords', 'trendingKeywords', 'potentialOpportunities'].forEach(key => {
      acc[key] = [...acc[key], ...summary[key]];
    });

    return acc;
  }, {
    totalKeywords: 0,
    totalETV: 0,
    rankingDistribution: {},
    topKeywords: [],
    keywordDifficultyDistribution: {},
    searchIntentDistribution: {},
    trendingKeywords: [],
    potentialOpportunities: [],
    serpFeatureDistribution: {},
    averageBacklinks: 0,
  } as RankingSummary);
}

export default SEOStrategyRecommendations;

