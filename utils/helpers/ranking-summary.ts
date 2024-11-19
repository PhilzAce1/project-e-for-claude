import { Rankings, RankingItem } from './ranking-data-types';

interface RankingSummary {
  totalKeywords: number;
  totalETV: number;
  rankingDistribution: Record<string, number>;
  topKeywords: Array<{ keyword: string; etv: number; rank: number; rankChange: number }>;
  keywordDifficultyDistribution: Record<string, number>;
  searchIntentDistribution: Record<string, number>;
  trendingKeywords: Array<{ keyword: string; rankImprovement: number }>;
  potentialOpportunities: Array<{ keyword: string; rank: number }>;
  serpFeatureDistribution: Record<string, number>;
  averageBacklinks: number;
}

function generateRankingsSummary(rankings: Rankings): RankingSummary {
  const items = rankings.rankings_data.items;

  const summary: RankingSummary = {
    totalKeywords: items?.length || 0,
    totalETV: 0,
    rankingDistribution: {},
    topKeywords: [],
    keywordDifficultyDistribution: {},
    searchIntentDistribution: {},
    trendingKeywords: [],
    potentialOpportunities: [],
    serpFeatureDistribution: {},
    averageBacklinks: 0,
  };

  let totalBacklinks = 0;

  items?.forEach((item: RankingItem) => {
    const { keyword_data, ranked_serp_element } = item;
    const { serp_item } = ranked_serp_element;
    const rank = serp_item.rank_absolute;

    // Calculate total ETV
    summary.totalETV += serp_item.etv;

    // Ranking distribution
    const rankRange = getRankRange(rank);
    summary.rankingDistribution[rankRange] = (summary.rankingDistribution[rankRange] || 0) + 1;

    // Top keywords
    summary.topKeywords.push({
      keyword: keyword_data.keyword,
      etv: serp_item.etv,
      rank,
      rankChange: serp_item.rank_changes.previous_rank_absolute 
        ? serp_item.rank_changes.previous_rank_absolute - rank 
        : 0
    });

    // Keyword difficulty distribution
    const difficultyLevel = getKeywordDifficultyLevel(keyword_data.keyword_properties.keyword_difficulty);
    summary.keywordDifficultyDistribution[difficultyLevel] = (summary.keywordDifficultyDistribution[difficultyLevel] || 0) + 1;

    // Search intent distribution
    const intent = keyword_data.search_intent_info.main_intent;
    summary.searchIntentDistribution[intent] = (summary.searchIntentDistribution[intent] || 0) + 1;

    // Trending keywords
    if (serp_item.rank_changes.is_up) {
      summary.trendingKeywords.push({
        keyword: keyword_data.keyword,
        rankImprovement: serp_item.rank_changes.previous_rank_absolute 
          ? serp_item.rank_changes.previous_rank_absolute - rank 
          : 0
      });
    }

    // Potential opportunities
    if (rank > 10 && rank <= 20) {
      summary.potentialOpportunities.push({ keyword: keyword_data.keyword, rank });
    }

    // SERP feature distribution
    keyword_data.serp_info.serp_item_types.forEach(feature => {
      summary.serpFeatureDistribution[feature] = (summary.serpFeatureDistribution[feature] || 0) + 1;
    });

    // Backlinks
    if (serp_item.backlinks_info) {
      totalBacklinks += serp_item.backlinks_info.backlinks;
    }
  });

  // Sort and limit top keywords
  summary.topKeywords.sort((a, b) => b.etv - a.etv);
  summary.topKeywords = summary.topKeywords.slice(0, 10);

  // Sort trending keywords
  summary.trendingKeywords.sort((a, b) => b.rankImprovement - a.rankImprovement);
  summary.trendingKeywords = summary.trendingKeywords.slice(0, 10);

  // Calculate average backlinks
  summary.averageBacklinks = totalBacklinks / items?.length;

  return summary;
}

function getRankRange(rank: number): string {
  if (rank <= 3) return '1-3';
  if (rank <= 10) return '4-10';
  if (rank <= 20) return '11-20';
  if (rank <= 50) return '21-50';
  return '51+';
}

function getKeywordDifficultyLevel(difficulty: number): string {
  if (difficulty < 15) return 'Very Easy';
  if (difficulty < 35) return 'Easy';
  if (difficulty < 55) return 'Moderate';
  if (difficulty < 75) return 'Difficult';
  return 'Very Difficult';
}

export default generateRankingsSummary;