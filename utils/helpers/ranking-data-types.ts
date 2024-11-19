// Basic types
type MonthlySearch = {
  year: number;
  month: number;
  search_volume: number;
};

type BacklinksInfo = {
  dofollow: number;
  backlinks: number;
  time_update: string;
  referring_pages: number;
  referring_domains: number;
  referring_main_domains: number;
};

type RankChanges = {
  is_up: boolean;
  is_new: boolean;
  is_down: boolean;
  previous_rank_absolute: number | null;
};

// Keyword Data
interface KeywordInfo {
  cpc: number | null;
  se_type: string;
  categories: number[];
  competition: number | null;
  search_volume: number;
  monthly_searches: MonthlySearch[];
  competition_level: string;
  last_updated_time: string;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
}

interface ImpressionsInfo {
  bid: number | null;
  cpc_max: number | null;
  cpc_min: number | null;
  se_type: string;
  match_type: string | null;
  cpc_average: number | null;
  daily_cost_max: number | null;
  daily_cost_min: number | null;
  ad_position_max: number | null;
  ad_position_min: number | null;
  daily_clicks_max: number | null;
  daily_clicks_min: number | null;
  last_updated_time: string;
  daily_cost_average: number | null;
  ad_position_average: number | null;
  daily_clicks_average: number | null;
  daily_impressions_max: number | null;
  daily_impressions_min: number | null;
  daily_impressions_average: number | null;
}

interface AvgBacklinksInfo {
  rank: number;
  se_type: string;
  dofollow: number;
  backlinks: number;
  referring_pages: number;
  main_domain_rank: number;
  last_updated_time: string;
  referring_domains: number;
  referring_main_domains: number;
}

interface KeywordProperties {
  se_type: string;
  core_keyword: string | null;
  detected_language: string;
  keyword_difficulty: number;
  is_another_language: boolean;
  synonym_clustering_algorithm: string | null;
}

interface SearchIntentInfo {
  se_type: string;
  main_intent: string;
  foreign_intent: string[] | null;
  last_updated_time: string;
}

interface KeywordData {
  keyword: string;
  se_type: string;
  serp_info: {
    se_type: string;
    check_url: string;
    serp_item_types: string[];
    se_results_count: number;
    last_updated_time: string;
    previous_updated_time: string;
  };
  keyword_info: KeywordInfo;
  language_code: string;
  location_code: number;
  impressions_info: ImpressionsInfo;
  avg_backlinks_info: AvgBacklinksInfo;
  keyword_properties: KeywordProperties;
  search_intent_info: SearchIntentInfo;
  clickstream_keyword_info: any | null; // You might want to define a more specific type if you have this data
  keyword_info_normalized_with_bing: any | null; // Same here
  keyword_info_normalized_with_clickstream: any | null; // And here
}

// SERP Item
interface SerpItem {
  etv: number;
  url: string;
  type: string;
  title: string;
  domain: string;
  se_type: string;
  position: string;
  rank_info: {
    page_rank: number;
    main_domain_rank: number;
  };
  breadcrumb: string;
  rank_group: number;
  description: string;
  highlighted: string[];
  main_domain: string;
  rank_changes: RankChanges;
  relative_url: string;
  website_name: string;
  rank_absolute: number;
  backlinks_info: BacklinksInfo | null;
  estimated_paid_traffic_cost: number | null;
  // ... other properties
}

// Ranked SERP Element
interface RankedSerpElement {
  is_lost: boolean;
  se_type: string;
  check_url: string;
  serp_item: SerpItem;
  serp_item_types: string[];
  se_results_count: number;
  last_updated_time: string;
  keyword_difficulty: number;
  previous_updated_time: string;
}

// Ranking Item
interface RankingItem {
  se_type: string;
  keyword_data: KeywordData;
  ranked_serp_element: RankedSerpElement;
}

// Metrics
interface Metrics {
  etv: number;
  count: number;
  is_up: number;
  pos_1: number;
  is_new: number;
  is_down: number;
  is_lost: number;
  // ... other position metrics (pos_2_3, pos_4_10, etc.)
  clickstream_etv: number | null;
  impressions_etv: number;
  estimated_paid_traffic_cost: number;
}

// Rankings Data
interface RankingsData {
  items: RankingItem[];
  metrics: {
    paid: Metrics;
    organic: Metrics;
    local_pack: Metrics | null;
    featured_snippet: Metrics | null;
  };
  total_count: number;
}

// Main Rankings Interface
interface Rankings {
  id: number;
  domain: string;
  rankings_data: RankingsData;
  rankings_updated_at: string;
}

export type { Rankings, RankingItem, KeywordData, SerpItem, Metrics, ImpressionsInfo, AvgBacklinksInfo, KeywordProperties, SearchIntentInfo };
