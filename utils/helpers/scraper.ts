import * as cheerio from 'cheerio';
import { sanitizeUrl } from '@/utils/helpers/sanitizeUrl';

interface ScrapingResult {
  url: string;
  content: string;
  error?: string;
}

export async function scrapeUrls(urls: string[]): Promise<string> {
  console.log('🚀 Starting scraper with URLs:', urls);
  const results: ScrapingResult[] = [];

  // Process URLs in batches of 3 to avoid overwhelming resources
  for (let i = 0; i < urls.length; i += 3) {
    const batch = urls.slice(i, i + 3);
    console.log(`🔄 Processing batch ${i/3 + 1}/${Math.ceil(urls.length/3)}:`, batch);
    
    const batchPromises = batch.map(async (url) => {
      console.log(`📄 Starting to scrape: ${url}`);
      try {
        const sanitizedUrl = sanitizeUrl(url);
        console.log(`🌐 Fetching: ${sanitizedUrl}`);
        
        const response = await fetch(sanitizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          },
          redirect: 'follow',
          next: { revalidate: 0 }
        });

        console.log(`🔍 Response status for ${url}:`, response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        console.log(`📋 Content-Type for ${url}:`, contentType);

        if (!contentType || !contentType.includes('text/html')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }

        const html = await response.text();
        console.log(`✅ Content fetched from ${url}, length: ${html.length} characters`);

        if (!html) {
          throw new Error('Empty HTML response');
        }

        // Load HTML into cheerio
        const $ = cheerio.load(html);
        console.log(`🔧 Cheerio loaded HTML for ${url}`);

        // Remove unwanted elements
        $('script, style, noscript, header, footer, nav, [class*="menu"], [class*="nav"], [class*="sidebar"], [class*="ad"], [class*="cookie"], [class*="popup"]').remove();

        // Get main content or fallback to body
        let content = $('main, article, .content, #content, .post').text();
        if (!content) {
          console.log(`⚠️ No main content found for ${url}, falling back to body`);
          content = $('body').text();
        }

        // Clean up the text
        content = content
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000); // Limit content length

        if (!content) {
          throw new Error('No content extracted');
        }

        console.log(`📝 Content extracted from ${url}: ${content.length} characters`);
        console.log(`📄 First 100 characters: ${content.slice(0, 100)}...`);

        return {
          url,
          content
        };

      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error);
        console.error('Full error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        return {
          url,
          content: '',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });

    console.log('⏳ Waiting for batch promises to resolve...');
    const batchResults = await Promise.all(batchPromises);
    console.log('✅ Batch complete:', batchResults.map(r => ({
      url: r.url,
      contentLength: r.content.length,
      error: r.error
    })));
    results.push(...batchResults);
  }

  const successfulResults = results.filter(r => r.content);
  console.log(`📊 Scraping complete. Found content for ${successfulResults.length}/${urls.length} URLs`);
  console.log('📋 Results summary:', results.map(r => ({
    url: r.url,
    success: !!r.content,
    contentLength: r.content.length,
    error: r.error
  })));
  
  // Combine all results into a single string with separators
  const finalContent = successfulResults
    .map(result => `File: ${result.url}\n\n${result.content}\n\n-------\n\n`)
    .join('');

  console.log(`📝 Final content length: ${finalContent.length} characters`);
  return finalContent;
}