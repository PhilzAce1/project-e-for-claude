import { createClient } from '@supabase/supabase-js';
import { discoverAndScrapeSitemap } from './index';

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export async function syncSitemapContent(domain: string, userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    added: 0,
    updated: 0,
    removed: 0,
    errors: []
  };

  try {
    // 1. Get existing content for the domain
    const { data: existingContent, error: fetchError } = await serviceRoleClient
      .from('content')
      .select('url, last_modified, change_frequency, priority')
      .eq('user_id', userId)
      .eq('sitemap_discovered', true);

    if (fetchError) {
      throw fetchError;
    }

    const existingUrls = new Map(existingContent?.map(content => [content.url, content]) || []);

    // 2. Scrape current sitemap
    const scrapedPages = await discoverAndScrapeSitemap(domain, 500, userId);
    const currentUrls = new Set(scrapedPages.map(page => page.url));

    // 3. Process updates and additions
    for (const page of scrapedPages) {
      const existing = existingUrls.get(page.url);
      
      if (!existing) {
        // New page
        try {
          await serviceRoleClient
            .from('content')
            .insert({
              user_id: userId,
              url: page.url,
              title: page.title,
              description: page.description,
              last_modified: page.lastModified,
              change_frequency: page.changeFrequency,
              priority: page.priority,
              sitemap_discovered: true,
              last_sync: new Date().toISOString(),
              sync_status: 'synced',
              status: 'published'
            });
          result.added++;
        } catch (error) {
          result.errors.push(`Failed to add ${page.url}: ${error}`);
        }
      } else if (page.lastModified && existing.last_modified !== page.lastModified) {
        // Updated page
        try {
          await serviceRoleClient
            .from('content')
            .update({
              title: page.title,
              description: page.description,
              last_modified: page.lastModified,
              change_frequency: page.changeFrequency,
              priority: page.priority,
              last_sync: new Date().toISOString(),
              sync_status: 'synced'
            })
            .eq('url', page.url)
            .eq('user_id', userId);
          result.updated++;
        } catch (error) {
          result.errors.push(`Failed to update ${page.url}: ${error}`);
        }
      }
    }

    // 4. Handle removed pages
    for (const [url] of Array.from(existingUrls.entries())) {
      if (!currentUrls.has(url)) {
        try {
          await serviceRoleClient
            .from('content')
            .update({
              sync_status: 'removed',
              last_sync: new Date().toISOString()
            })
            .eq('url', url)
            .eq('user_id', userId);
          result.removed++;
        } catch (error) {
          result.errors.push(`Failed to mark ${url} as removed: ${error}`);
        }
      }
    }

    return result;
  } catch (error) {
    result.errors.push(`Sync failed: ${error}`);
    return result;
  }
} 