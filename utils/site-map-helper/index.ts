
import robotsParser from 'robots-parser';
import * as cheerio from 'cheerio';
import puppeteer, { BrowserContext, Page } from 'puppeteer';
import { URL } from 'url';
import { JSDOM } from 'jsdom';
import { Browser } from 'puppeteer';
import { createClient } from "@supabase/supabase-js";


const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sitemapDataMap = new Map<string, {
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
}>();

export interface PageData {
  url: string;
  domain: string;
  title: string;
  description?: string;
  lastModified?: string;
  changeFrequency?: string;
  priority?: number;
  links?: string[];
}

let browser: Browser | null = null;
export async function storePageDataInDatabase(pageData: PageData[], domain: string, userId: string) {
  try {
    if (pageData.length === 0) {
      return;
    }

    const formattedData = pageData.map(page => ({
      url: page.url,
      title: page.title,
      user_id: userId,
      description: page.description,
      last_modified: page.lastModified,
      change_frequency: page.changeFrequency,  // Store the new field
      priority: page.priority, 
      last_sync: new Date().toISOString()
    }));

    console.log("Formatted Data", formattedData);

    const batchSize = 100; 
    for (let i = 0; i < formattedData.length; i += batchSize) {
      const batch = formattedData.slice(i, i + batchSize);

      const { data, error } = await serviceRoleClient
        .from('content')
        .upsert(batch)
        .select();
      
      if (error) {
        console.error(`Error storing batch ${i}-${i+batchSize}:`, error);
      }
    }


  } catch (error) {
    console.error(`Error storing page data in database for ${domain}:`, error);
  }
}
class PagePool {
  private pages: Page[] = [];
  private context: BrowserContext;
  private size: number;

  constructor(context: BrowserContext, size: number) {
    this.context = context;
    this.size = size;
  }

  async initialize() {
    for (let i = 0; i < this.size; i++) {
      const page = await this.context.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; WebsiteIndexer/1.0)');
      this.pages.push(page);
    }
  }

  async getPage(): Promise<Page> {
    if (this.pages.length === 0) {
      const page = await this.context.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; WebsiteIndexer/1.0)');
      return page;
    }
    return this.pages.pop()!;
  }

  async releasePage(page: Page) {
    if (this.pages.length < this.size) {
      this.pages.push(page);
    } else {
      await page.close();
    }
  }

  async close() {
    await Promise.all(this.pages.map(page => page.close()));
    this.pages = [];
  }
}

async function scrapeWebsite(
  domain: string,
  maxPages: number = 100,
  concurrentRequests: number = 10, 
  userId: string
): Promise<PageData[]> {
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const baseUrl = `https://${normalizedDomain}`;
  
  const discoveredUrls = new Set<string>([baseUrl]);
  const queuedUrls: string[] = [baseUrl];
  const scrapedPages: PageData[] = [];
  const visitedUrls = new Set<string>();
  const failedUrls = new Set<string>();

  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  }
  
  const context = await browser.createBrowserContext();
  const pagePool = new PagePool(context, concurrentRequests);
  await pagePool.initialize();

  await tryGetSitemapUrls(normalizedDomain, discoveredUrls, queuedUrls, userId);
  
  try {
    while (queuedUrls.length > 0 && scrapedPages.length < maxPages) {
      const urlsToProcess = queuedUrls.splice(0, concurrentRequests);
      const validUrlsToProcess = urlsToProcess.filter(url => !visitedUrls.has(url));
      
      console.log("Processing URLs:", validUrlsToProcess);
      

      for (const url of validUrlsToProcess) {
        visitedUrls.add(url);
      }
      

      const results = await Promise.all(
        validUrlsToProcess.map(url => 
          fetchAndProcessUrl(url, normalizedDomain, discoveredUrls, queuedUrls, failedUrls, pagePool)
        )
      );
      
      console.log("Results:", results);
      

      results.filter((result: any): result is PageData => Boolean(result)).forEach((page: any) => {
        if (scrapedPages.length < maxPages) {
          scrapedPages.push(page);
        }
      });      

      if (scrapedPages.length >= maxPages) break;
      

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } finally {
    await pagePool.close();
    await context.close();
  }
  
  return scrapedPages;
}

async function fetchAndProcessUrl(
  url: string,
  domain: string, 
  discoveredUrls: Set<string>,
  queuedUrls: string[],
  failedUrls: Set<string>,
  pagePool: PagePool
): Promise<PageData | null> {
  let page: Page | null = null;
  
  console.log(`START processing URL: ${url}`);
  
  try {
    
    let html: string = "";
    let lastModified: string | undefined;
    let contentType: string | null = null;
    let usedPuppeteer = false;
    
    // Get data from sitemap if available
    const sitemapData = sitemapDataMap.get(url);
    const changeFrequency = sitemapData?.changeFrequency;
    const priority = sitemapData?.priority;
    
    // If lastModified is in the sitemap, use it as the default
    if (sitemapData?.lastModified) {
      lastModified = sitemapData.lastModified;
    }
    
    try {
      console.log(`Attempting fetch for: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Fetch response status: ${response.status}`);
      console.log(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      
      
      html = await response.text();
      console.log(`Fetch HTML length: ${html.length}`);
      console.log(`HTML preview: ${html.substring(0, 100)}...`);
      
      // Only set lastModified from headers if not already set from sitemap
      if (!lastModified) {
        lastModified = response.headers.get('last-modified') || undefined;
      }
      
      
      // if (isLikelyJSRendered(html)) {
      //   throw new Error('Page appears to be JS-rendered, switching to Puppeteer');
      // }
    } catch (error) {
      
      console.log(`Fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      
      console.log(`Falling back to Puppeteer for: ${url}`);
      try {
        page = await pagePool.getPage();
        usedPuppeteer = true;
        
        
        await page.setDefaultNavigationTimeout(30000); 
        
        
        const response = await page.goto(url, { 
          waitUntil: 'networkidle2', 
          timeout: 25000  
        });
        
        
        if (response) {
          const headers = response.headers();
          contentType = headers['content-type'];
          
          // Only set lastModified from headers if not already set from sitemap
          if (!lastModified) {
            lastModified = headers['last-modified'];
          }
          
          console.log(`Puppeteer response headers: ${JSON.stringify(headers)}`);
        }
        
        
        html = await page.content();
        console.log(`Puppeteer HTML length: ${html.length}`);
        console.log(`Puppeteer HTML preview: ${html.substring(0, 100)}...`);
      } catch (puppeteerError) {
        console.error(`Puppeteer error for ${url}:`, 
                      puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error');
        throw puppeteerError; // Re-throw to be caught by the outer try/catch
      }
    }
    
    console.log(`HTML acquired, length: ${html.length}, used Puppeteer: ${usedPuppeteer}`);
    
    if (!html || html.trim().length === 0) {
      console.warn(`Empty HTML content for ${url}`);
      return null;
    }
    
    
    console.log(`Parsing HTML with Cheerio for ${url}`);
    const $ = cheerio.load(html, {
      xml: {
        decodeEntities: false
      },
      xmlMode: false          
    });
    
    
    const title = $('title').text().trim();
    console.log(`Title: "${title}"`);
    
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || 
                        undefined;
    console.log(`Description: "${description}"`);
    
    
    const links: string[] = [];
    const seenLinks = new Set<string>();
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        
        const resolvedUrl = new URL(href, url).toString();
        
        
        if (resolvedUrl.includes(domain)) {
          const normalizedUrl = normalizeUrl(resolvedUrl);
          
          if (normalizedUrl && !seenLinks.has(normalizedUrl)) {
            seenLinks.add(normalizedUrl);
            links.push(normalizedUrl);
            
            
            if (!discoveredUrls.has(normalizedUrl)) {
              discoveredUrls.add(normalizedUrl);
              queuedUrls.push(normalizedUrl);
            }
          }
        }
      } catch (error) {
        // Invalid URL, skip
      }
    });
    
    console.log(`Found ${links.length} links on page ${url}`);
    
    // Create the PageData object with the new fields
    const pageData: PageData = {
      url,
      domain,
      title: title || url.split('/').pop() || 'Untitled Page', // Provide a fallback title
      description,
      lastModified,
      changeFrequency,  // Add the change frequency from sitemap
      priority,         // Add the priority from sitemap
      links
    };
    
    console.log(`SUCCESS: Processed ${url}`);
    console.log(`Page data: ${JSON.stringify({
      url: pageData.url,
      title: pageData.title,
      description: pageData.description?.substring(0, 50) + '...',
      lastModified: pageData.lastModified,
      changeFrequency: pageData.changeFrequency,  // Log the new fields
      priority: pageData.priority,
      links: pageData.links?.slice(0, 5) || []
    })}`);
    
    return pageData;
    
  } catch (error) {
    console.error(`FAILED: Error processing ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    failedUrls.add(url);
    return null;
  } finally {
    // Always release the page back to the pool if we used one
    if (page) {
      await pagePool.releasePage(page);
      console.log(`Released Puppeteer page for ${url}`);
    }
    console.log(`END processing URL: ${url}`);
  }
}


function isLikelyJSRendered(html: string): boolean {
  // Quick heuristic check before expensive DOM parsing
  if (html.length < 5000 && 
      (html.includes('react') || 
       html.includes('vue') || 
       html.includes('angular') || 
       html.includes('__NEXT_DATA__'))) {
    return true;
  }
  
  // Lightweight check for script-to-content ratio
  const scriptTags = (html.match(/<script/g) || []).length;
  const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  
  if (scriptTags > 5 && (!bodyContent || bodyContent[1].length < 1000)) {
    return true;
  }
  
  return false;
}

 
async function tryGetSitemapUrls(
  domain: string, 
  discoveredUrls: Set<string>,
  queuedUrls: string[], 
  userId: string 
): Promise<void> {
  // Common sitemap locations
  const sitemapLocations = [
    `/sitemap.xml`,
    `/sitemap_index.xml`,
    `/sitemap-index.xml`,
    `/wp-sitemap.xml`,
    `/sitemapindex.xml`,
    `/page-sitemap.xml`
  ];
  
  let foundValidSitemap = false;

  // Try robots.txt first as it's often more reliable
  try {
    const robotsTxtUrl = `https://${domain}/robots.txt`;
    const response = await fetch(robotsTxtUrl, { 
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });


    
    if (response.ok) {
      const robotsTxt = await response.text();
      const robotsTxtParser = robotsParser(robotsTxtUrl, robotsTxt);
      const sitemapMatches = robotsTxtParser.getSitemaps();
      
      if (sitemapMatches && sitemapMatches.length > 0) {
        // Process all sitemaps from robots.txt in parallel
        const results = await Promise.all(sitemapMatches.map(sitemapUrl => 
          processSitemap(sitemapUrl, domain, discoveredUrls, queuedUrls)
        ));
        
        // Check if any of the sitemaps were valid
        foundValidSitemap = results.some(result => result !== undefined);        
        // If we found URLs, we can skip checking the common locations
        if (queuedUrls.length > 1) {
          await updateSitemapValidStatus(domain, userId, foundValidSitemap);
          return;
        }
      }
    }
  } catch (error) {
    // Fall through to try common locations
  }


  const results = await Promise.all(sitemapLocations.map(location => {
    const sitemapUrl = `https://${domain}${location}`;
    return processSitemap(sitemapUrl, domain, discoveredUrls, queuedUrls);
  }));
  
  // Check if any of the common locations were valid
  foundValidSitemap = foundValidSitemap || results.some(result => result !== undefined);
  
  // Update the database with the sitemap validity status
  await updateSitemapValidStatus(domain, userId, foundValidSitemap);
  
  // Try common sitemap locations in parallel
  await Promise.all(sitemapLocations.map(location => {
    const sitemapUrl = `https://${domain}${location}`;
    return processSitemap(sitemapUrl, domain, discoveredUrls, queuedUrls);
  }));
}

async function processSitemap(
  sitemapUrl: string,
  domain: string,
  discoveredUrls: Set<string>,
  queuedUrls: string[]
): Promise<boolean> {
  try {
    const response = await fetch(sitemapUrl, { 
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('xml')) return false;
    
    const sitemapContent = await response.text();
    
    // Check if it's a sitemap index and process nested sitemaps in parallel
    if (sitemapContent.includes('<sitemapindex')) {
      const $ = cheerio.load(sitemapContent, { xmlMode: true });
      const nestedSitemaps: string[] = [];
      
      $('sitemap loc').each((_, element) => {
        const nestedUrl = $(element).text().trim();
        if (nestedUrl && nestedUrl.includes(domain)) {
          nestedSitemaps.push(nestedUrl);
        }
      });
      
      // Process all nested sitemaps in parallel
      const results = await Promise.all(nestedSitemaps.map(url => 
        processSitemap(url, domain, discoveredUrls, queuedUrls)
      ));
      
      // If any nested sitemap was valid, this is a valid sitemap
      return results.some(result => result === true);
    } else {
      // Regular sitemap - extract URLs efficiently
      extractUrlsFromSitemap(sitemapContent, domain, discoveredUrls, queuedUrls);
      return queuedUrls.length > 0;  // Valid if we found at least one URL
    }
  } catch (error) {
    // Silently fail - return false for this sitemap
    return false;
  }
}


async function updateSitemapValidStatus(domain: string, userId: string, isValid: boolean): Promise<void> {
  try {

    const { data, error: checkError } = await serviceRoleClient
    .from('seo_crawls')
    .select('*')
    .match({  user_id: userId })
    .single();
  
  if (checkError) {
    console.error(`Error checking if record exists: ${checkError.message}`);
    return;
  }
  
  if (data) {
    // Record exists, update it
    const { error: updateError } = await serviceRoleClient
      .from('seo_crawls')
      .update({ website_site_map_valid: isValid })
      .match({  user_id: userId });
      
    if (updateError) {
      console.error(`Error updating sitemap validity: ${updateError.message}`);
    }
  } else {
    console.error(`No record found for domain ${domain} and user ${userId}`);
  }

  } catch (error) {
    console.error(`Error in database operation for ${domain}:`, error);
  }
}
function extractUrlsFromSitemap(
  sitemapXml: string, 
  domain: string, 
  discoveredUrls: Set<string>,
  queuedUrls: string[]
): void {
  try {
    const $ = cheerio.load(sitemapXml, { xmlMode: true });
    
    // Process URLs in a regular sitemap
    $('url').each((_, urlElement) => {
      const locElement = $(urlElement).find('loc');
      const urlValue = locElement.text().trim();
      
      if (urlValue && urlValue.includes(domain)) {
        const normalizedUrl = normalizeUrl(urlValue);
        
        if (normalizedUrl) {
          // Extract additional sitemap data
          const lastmodElement = $(urlElement).find('lastmod');
          const changefreqElement = $(urlElement).find('changefreq');
          const priorityElement = $(urlElement).find('priority');
          
          // Store the sitemap metadata
          sitemapDataMap.set(normalizedUrl, {
            lastModified: lastmodElement.length ? lastmodElement.text().trim() : undefined,
            changeFrequency: changefreqElement.length ? changefreqElement.text().trim() : undefined,
            priority: priorityElement.length ? parseFloat(priorityElement.text().trim()) : undefined
          });
          
          if (!discoveredUrls.has(normalizedUrl)) {
            discoveredUrls.add(normalizedUrl);
            queuedUrls.push(normalizedUrl);
          }
        }
      }
    });
  } catch (error) {
    // Silently fail
  }
}

function normalizeUrl(url: string): string | null {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    
    // Skip certain file types quickly - only the most obvious binary files
    const pathname = parsedUrl.pathname.toLowerCase();
    const skipExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.mp3', '.mp4', '.avi'];
    if (skipExtensions.some(ext => pathname.endsWith(ext))) {
      return null;
    }
    
    // Remove trailing slashes, convert to lowercase
    let normalized = `${parsedUrl.origin}${pathname}`;
    normalized = normalized.replace(/\/$/, '');
    
    // Keep the query parameters but remove fragments
    if (parsedUrl.search) {
      normalized += parsedUrl.search;
    }
    
    return normalized;
  } catch (error) {
    console.warn(`Unable to normalize URL: ${url}`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
/**
 * Main function to discover and scrape a website
 */
export async function discoverAndScrapeSitemap(domain: string, maxPages: number = 200, userId: string): Promise<PageData[]> {
  try {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    console.log("Starting scraping process for domain:", normalizedDomain);
    const scrapedPages = await scrapeWebsite(normalizedDomain, maxPages, 10, userId);
    await storePageDataInDatabase(scrapedPages, normalizedDomain, userId);

  
    try {
      // If no pages were scraped or the sitemap data is empty, set website_site_map_valid to false
      const hasSitemapData = sitemapDataMap.size > 0;
      const siteMapValid = scrapedPages.length > 0 && hasSitemapData;
      
      const { data, error } = await serviceRoleClient
        .from('seo_crawls')
        .update({ 
          scraped_pages: scrapedPages.length,
          website_site_map_valid: siteMapValid
        })
        .eq('user_id', userId)
        .eq('domain', normalizedDomain)
        .select();

      if (error) {
        console.error(`Error updating SEO crawl data for ${domain}:`, error);
      } else {
        console.log(`SEO crawl data updated successfully for ${domain}`);
      }
    } catch (error) {
      console.error(`Error inserting SEO crawl data for ${domain}:`, error);
    }
    
    return scrapedPages;
  } catch (error) {
    console.error(`Error discovering and scraping website ${domain}:`, error);
    
    // Update website_site_map_valid to false on error
    try {
      const { error: updateError } = await serviceRoleClient
        .from('seo_crawls')
        .update({ website_site_map_valid: false })
        .eq('user_id', userId)
        .eq('domain', domain.replace(/^https?:\/\//, '').replace(/\/$/, ''));
        
      if (updateError) {
        console.error(`Error updating sitemap validity on error: ${updateError.message}`);
      }
    } catch (dbError) {
      console.error(`Database error when updating sitemap validity: ${dbError}`);
    }
    
    return [];
  } finally {
    // Only close the browser at the very end of the process or on error
    if (browser) {
      await browser.close();
      browser = null;
    }
  }
}