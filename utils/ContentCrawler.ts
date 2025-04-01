// lib/ContentCrawler.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { SupabaseClient } from '@supabase/supabase-js';

interface CrawlOptions {
  maxPages?: number;
  followExternalLinks?: boolean;
  ignoreQueryParams?: boolean;
  excludePatterns?: string[];
}

interface PageData {
  url: string;
  title: string;
  description: string;
  h1: string;
  contentText: string;
  wordCount: number;
}

export class ContentCrawler {
  private supabase: SupabaseClient;
  private userId: string;
  private siteUrl: string;
  private options: CrawlOptions;
  private visitedUrls: Set<string> = new Set();
  private queue: string[] = [];
  private results: PageData[] = [];

  constructor(
    supabase: SupabaseClient,
    userId: string,
    siteUrl: string,
    options: CrawlOptions = {},
  ) {
    this.supabase = supabase;
    this.userId = userId;
    this.siteUrl = this.normalizeUrl(siteUrl);
    this.options = {
      maxPages: options.maxPages || 100,
      followExternalLinks: options.followExternalLinks || false,
      ignoreQueryParams: options.ignoreQueryParams || true,
      excludePatterns: options.excludePatterns || [
        '/wp-admin',
        '/wp-login',
        '/cart',
        '/checkout',
        '.pdf',
        '.jpg',
        '.png',
        '.gif',
      ],
    };
  }

  /**
   * Start the crawl process
   */
  async crawl(): Promise<PageData[]> {
    this.queue = [this.siteUrl];
    this.visitedUrls.clear();
    this.results = [];

    try {
      while (this.queue.length > 0 && this.results.length < this.options.maxPages!) {
        const url = this.queue.shift()!;

        if (this.shouldSkipUrl(url)) {
          continue;
        }

        this.visitedUrls.add(url);

        try {
          const pageData = await this.crawlPage(url);
          this.results.push(pageData);

          // Save to database
          await this.savePageData(pageData);

          // Delay to be respectful
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error crawling ${url}:`, error);
        }
      }

      return this.results;
    } catch (error) {
      console.error('Crawl error:', error);
      throw error;
    }
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string): Promise<PageData> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'ContentCrawler/1.0',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract links and add to queue
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const absoluteUrl = this.resolveUrl(url, href);
        if (
          absoluteUrl &&
          !this.visitedUrls.has(absoluteUrl) &&
          !this.queue.includes(absoluteUrl)
        ) {
          // Only add to queue if it's from the same domain or if followExternalLinks is true
          const isExternal = !absoluteUrl.startsWith(this.siteUrl);
          if (!isExternal || this.options.followExternalLinks) {
            this.queue.push(absoluteUrl);
          }
        }
      }
    });

    // Extract page data
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const h1 = $('h1').first().text().trim();

    // Extract content from common content areas
    let contentText = '';
    const contentSelectors = ['article', '.content', '#content', 'main', '.main', '#main'];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        contentText = element.text().trim();
        break;
      }
    }

    // Fallback to body if no content found
    if (!contentText) {
      // Remove navigation, footer, etc.
      $('nav, header, footer, aside, .sidebar, #sidebar, .menu, #menu').remove();
      contentText = $('body').text().trim();
    }

    // Clean up text
    contentText = contentText.replace(/\s+/g, ' ').trim();

    // Count words
    const wordCount = contentText.split(/\s+/).filter(Boolean).length;

    return {
      url,
      title,
      description,
      h1,
      contentText,
      wordCount,
    };
  }

  /**
   * Save page data to the database
   */
  private async savePageData(pageData: PageData): Promise<void> {
    const { data, error } = await this.supabase
      .from('content_inventory')
      .upsert({
        user_id: this.userId,
        site_url: this.siteUrl,
        page_url: pageData.url,
        title: pageData.title,
        description: pageData.description,
        h1: pageData.h1,
        content_text: pageData.contentText,
        word_count: pageData.wordCount,
        last_crawled: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error saving page data:', error);
      throw error;
    }
  }

  /**
   * Helper method to check if a URL should be skipped
   */
  private shouldSkipUrl(url: string): boolean {
    // Check if URL is in the exclude patterns
    for (const pattern of this.options.excludePatterns!) {
      if (url.includes(pattern)) {
        return true;
      }
    }

    // Check if URL is from a different domain when not following external links
    if (!this.options.followExternalLinks && !url.startsWith(this.siteUrl)) {
      return true;
    }

    return false;
  }

  /**
   * Helper method to resolve relative URLs to absolute URLs
   */
  private resolveUrl(base: string, href: string): string | null {
    try {
      // Handle absolute URLs
      if (href.startsWith('http://') || href.startsWith('https://')) {
        const url = new URL(href);
        return this.options.ignoreQueryParams ? url.origin + url.pathname : url.href;
      }

      // Handle anchor links
      if (href.startsWith('#')) {
        return base;
      }

      // Handle relative URLs
      const url = new URL(href, base);
      return this.options.ignoreQueryParams ? url.origin + url.pathname : url.href;
    } catch (error) {
      console.error(`Error resolving URL ${href} from ${base}:`, error);
      return null;
    }
  }

  /**
   * Helper method to normalize URLs
   */
  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const parsedUrl = new URL(url);
    return parsedUrl.origin;
  }
}
