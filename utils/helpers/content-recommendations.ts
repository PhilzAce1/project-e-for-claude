import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Website {
  id: string;
  name: string;
  domain: string;
  agency_id: string;
}
export const calculateContentRecommendations = (rankings: any) => {
  if (!rankings?.items) return 0;

  // Filter for high-value opportunities
  return rankings.items.filter((item: any) => {
    const searchVolume = item.search_volume || 0;
    const rank = item.rank_absolute || 100;
    
    // Consider items that:
    // 1. Have decent search volume (>100)
    // 2. Are ranking between positions 11-30 (good potential to improve)
    // 3. Or are ranking 31-100 with high search volume
    return (searchVolume >= 100 && rank > 10 && rank <= 30) ||
           (searchVolume >= 500 && rank > 30 && rank <= 100);
  }).length;
};

export const fetchContentRecommendations = async (currentWebsite: Website) => {
  const supabase = createClientComponentClient();
  
  try {
    // Get user's business info
    const { data: businessInfo, error: businessError } = await supabase
      .from('business_information')
      .select('rankings_data, target_country')
      .eq('id', currentWebsite?.id)
      .single();

    if (businessError) throw businessError;

    // Get competitors data
    const { data: competitors, error: competitorsError } = await supabase
      .from('competitors')
      .select('items')
      .eq('business_id', currentWebsite?.id);

    if (competitorsError) throw competitorsError;

    // Process rankings data
    const mainSiteRankings = businessInfo?.rankings_data?.items || [];
    const competitorRankings = competitors?.flatMap(comp => comp.items || []) || [];

    // Combine and deduplicate keywords
    const allKeywords = new Map();
    
    // Add main site keywords
    mainSiteRankings.forEach((item: any) => {
      allKeywords.set(item.keyword, {
        keyword: item.keyword,
        search_volume: item.search_volume,
        rank: item.rank_absolute,
        current_ranking: true,
        competitor_ranks: []
      });
    });

    // Add competitor keywords
    competitorRankings.forEach((item: any) => {
      const existing = allKeywords.get(item.keyword);
      if (existing) {
        existing.competitor_ranks.push(item.rank_absolute);
      } else {
        allKeywords.set(item.keyword, {
          keyword: item.keyword,
          search_volume: item.search_volume,
          rank: null,
          current_ranking: false,
          competitor_ranks: [item.rank_absolute]
        });
      }
    });

    return {
      keywords: Array.from(allKeywords.values()),
      target_country: businessInfo?.target_country
    };
  } catch (error) {
    console.error('Error fetching content recommendations:', error);
    throw error;
  }
};
