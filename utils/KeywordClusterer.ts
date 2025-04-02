// lib/KeywordClusterer.ts
import { SupabaseClient } from '@supabase/supabase-js';
import natural from 'natural';

// Get stopwords from natural library
const stopwords = natural.stopwords;

const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

interface KeywordData {
  keyword: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface ClusterResult {
  name: string;
  keywords: string[];
  mainKeyword: string;
  averagePosition: number;
  totalClicks: number;
  totalImpressions: number;
  pages: string[];
  mainPage: string;
}

// Term interface for TfIdf
interface Term {
  term: string;
  tfidf: number;
}

export class KeywordClusterer {
  private supabase: SupabaseClient;
  private userId: string;
  private siteUrl: string;
  private minSimilarity: number;

  constructor(
    supabase: SupabaseClient,
    userId: string,
    siteUrl: string,
    minSimilarity: number = 0.3,
  ) {
    this.supabase = supabase;
    this.userId = userId;
    this.siteUrl = siteUrl;
    this.minSimilarity = minSimilarity;
  }

  /**
   * Get all keywords for the site from the database
   */
  async getKeywords(): Promise<KeywordData[]> {
    const { data, error } = await this.supabase
      .from('keyword_data')
      .select('keyword, page, clicks, impressions, ctr, position')
      .eq('user_id', this.userId)
      .eq('site_url', this.siteUrl);

    if (error) {
      console.error('Error fetching keywords:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create clusters from keywords
   */
  async createClusters(): Promise<ClusterResult[]> {
    const keywords = await this.getKeywords();

    if (keywords.length === 0) {
      return [];
    }

    // Preprocess keywords
    const processedKeywords = this.preprocessKeywords(keywords);

    // Calculate similarity matrix
    const similarityMatrix = await this.calculateSimilarityMatrix(processedKeywords, keywords);

    // Create clusters
    const clusters = this.formClusters(similarityMatrix, keywords);

    // Save clusters to database
    await this.saveClustersToDatabase(clusters);

    return clusters;
  }

  /**
   * Preprocess keywords for better similarity calculation
   */
  private preprocessKeywords(keywords: KeywordData[]): string[] {
    return keywords.map((kw) => {
      // Convert to lowercase
      const text = kw.keyword.toLowerCase();

      // Tokenize and remove stopwords
      const tokens = tokenizer.tokenize(text) || [];
      const filteredTokens = tokens.filter((token) => !stopwords.includes(token));

      // Stem words
      const stemmedTokens = filteredTokens.map((token) => stemmer.stem(token));

      return stemmedTokens.join(' ');
    });
  }

  /**
   * Calculate similarity matrix for all keywords
   */
  private async calculateSimilarityMatrix(
    processedKeywords: string[],
    originalKeywords: KeywordData[],
  ): Promise<number[][]> {
    const numKeywords = processedKeywords.length;
    // Initialize matrix with zeros
    const matrix: number[][] = Array(numKeywords)
      .fill(0)
      .map(() => Array(numKeywords).fill(0));

    // Create TF-IDF instance
    const tfidf = new natural.TfIdf();

    // Add documents
    processedKeywords.forEach((kw) => {
      tfidf.addDocument(kw);
    });

    // Calculate similarity for each pair
    for (let i = 0; i < numKeywords; i++) {
      // Diagonal is always 1 (self-similarity)
      matrix[i][i] = 1;
      for (let j = i + 1; j < numKeywords; j++) {
        let similarity = this.calculateCosineSimilarity(tfidf, i, j);

        const page1 = originalKeywords[i].page;
        const page2 = originalKeywords[j].page;

        if (page1 && page2 && page1 === page2) {
          // Boost similarity for keywords on the same page
          similarity += 0.2;
        }

        // Ensure similarity is between 0 and 1
        similarity = Math.min(1, Math.max(0, similarity));

        // Similarity is symmetric
        matrix[i][j] = similarity;
        matrix[j][i] = similarity;
      }
    }

    return matrix;
  }

  /**
   * Calculate cosine similarity between two documents
   */
  private calculateCosineSimilarity(
    tfidf: natural.TfIdf,
    doc1Index: number,
    doc2Index: number,
  ): number {
    const terms1 = new Map<string, number>();
    const terms2 = new Map<string, number>();

    // Get terms for document 1
    const terms1Array = tfidf.listTerms(doc1Index);
    terms1Array.forEach((item: Term) => {
      terms1.set(item.term, item.tfidf);
    });

    // Get terms for document 2
    const terms2Array = tfidf.listTerms(doc2Index);
    terms2Array.forEach((item: Term) => {
      terms2.set(item.term, item.tfidf);
    });

    let dotProduct = 0;
    terms1.forEach((value, term) => {
      if (terms2.has(term)) {
        dotProduct += value * terms2.get(term)!;
      }
    });

    let mag1 = 0;
    terms1.forEach((value) => {
      mag1 += value * value;
    });
    mag1 = Math.sqrt(mag1);

    let mag2 = 0;
    terms2.forEach((value) => {
      mag2 += value * value;
    });
    mag2 = Math.sqrt(mag2);

    // Prevent division by zero
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Form clusters based on similarity matrix
   */
  private formClusters(similarityMatrix: number[][], keywords: KeywordData[]): ClusterResult[] {
    const numKeywords = keywords.length;
    const visited = new Set<number>();
    const clusters: ClusterResult[] = [];

    for (let i = 0; i < numKeywords; i++) {
      if (visited.has(i)) {
        continue;
      }

      const cluster: number[] = [i];
      visited.add(i);

      // Find similar keywords
      for (let j = 0; j < numKeywords; j++) {
        if (i === j || visited.has(j)) {
          continue;
        }

        if (similarityMatrix[i][j] >= this.minSimilarity) {
          cluster.push(j);
          visited.add(j);
        }
      }

      // Create cluster data
      const clusterKeywords = cluster.map((idx) => keywords[idx].keyword);
      const totalClicks = cluster.reduce((sum, idx) => sum + keywords[idx].clicks, 0);
      const totalImpressions = cluster.reduce((sum, idx) => sum + keywords[idx].impressions, 0);
      const avgPosition =
        cluster.reduce((sum, idx) => sum + keywords[idx].position, 0) / cluster.length;

      // Find main keyword (highest clicks)
      const mainKeywordIdx = cluster.reduce(
        (maxIdx, idx) => (keywords[idx].clicks > keywords[maxIdx].clicks ? idx : maxIdx),
        cluster[0],
      );

      // Get unique pages for this cluster
      const pages = Array.from(new Set(cluster.map((idx) => keywords[idx].page)));

      // Find main page (most keywords)
      const pageCount = new Map<string, number>();
      cluster.forEach((idx) => {
        const page = keywords[idx].page;
        pageCount.set(page, (pageCount.get(page) || 0) + 1);
      });

      let mainPage = pages[0];
      let maxCount = 0;
      pageCount.forEach((count, page) => {
        if (count > maxCount) {
          maxCount = count;
          mainPage = page;
        }
      });

      // Create a descriptive name for the cluster
      const mainKeyword = keywords[mainKeywordIdx].keyword;

      clusters.push({
        name: `Cluster: ${mainKeyword}`,
        keywords: clusterKeywords,
        mainKeyword,
        averagePosition: Math.round(avgPosition * 100) / 100,
        totalClicks,
        totalImpressions,
        pages,
        mainPage,
      });
    }

    return clusters;
  }

  /**
   * Save clusters to database
   */
  private async saveClustersToDatabase(clusters: ClusterResult[]): Promise<void> {
    // First, delete existing clusters for this user and site
    const { error: deleteError } = await this.supabase
      .from('keyword_clusters')
      .delete()
      .eq('user_id', this.userId)
      .eq('site_url', this.siteUrl);

    if (deleteError) {
      console.error('Error deleting existing clusters:', deleteError);
      throw deleteError;
    }

    // Save each cluster
    for (const cluster of clusters) {
      // Insert cluster
      const { data: clusterData, error: clusterError } = await this.supabase
        .from('keyword_clusters')
        .insert({
          user_id: this.userId,
          site_url: this.siteUrl,
          cluster_name: cluster.name,
        })
        .select()
        .single();

      if (clusterError || !clusterData) {
        console.error('Error inserting cluster:', clusterError);
        continue;
      }

      // Insert keyword mappings
      const mappings = cluster.keywords.map((keyword) => ({
        cluster_id: clusterData.id,
        keyword,
        relevance_score: keyword === cluster.mainKeyword ? 1.0 : 0.8,
      }));

      const { error: mappingError } = await this.supabase
        .from('keyword_cluster_mappings')
        .insert(mappings);

      if (mappingError) {
        console.error('Error inserting keyword mappings:', mappingError);
      }

      // Map content to clusters
      await this.mapContentToClusters(clusterData.id, cluster);
    }
  }

  /**
   * Map content to clusters for content gap analysis
   */
  private async mapContentToClusters(clusterId: string, cluster: ClusterResult): Promise<void> {
    // Get content for the pages in this cluster
    const { data: contentItems, error: contentError } = await this.supabase
      .from('content_inventory')
      .select('id, page_url, title, content_text')
      .eq('user_id', this.userId)
      .eq('site_url', this.siteUrl)
      .in('page_url', cluster.pages);

    if (contentError || !contentItems) {
      console.error('Error fetching content for cluster:', contentError);
      return;
    }

    for (const content of contentItems) {
      // Calculate how well the content covers the keywords in the cluster
      const coverageScore = this.calculateContentCoverageScore(content, cluster.keywords);

      // Insert mapping
      const { error: mappingError } = await this.supabase.from('content_cluster_mappings').upsert({
        content_id: content.id,
        cluster_id: clusterId,
        coverage_score: coverageScore,
      });

      if (mappingError) {
        console.error('Error inserting content cluster mapping:', mappingError);
      }
    }
  }

  /**
   * Calculate how well content covers a set of keywords
   */
  private calculateContentCoverageScore(
    content: { title: string; content_text: string },
    keywords: string[],
  ): number {
    const contentText = (content.title + ' ' + content.content_text).toLowerCase();

    let coveredKeywords = 0;

    for (const keyword of keywords) {
      if (contentText.includes(keyword.toLowerCase())) {
        coveredKeywords++;
      }
    }

    return keywords.length > 0 ? coveredKeywords / keywords.length : 0;
  }
}
