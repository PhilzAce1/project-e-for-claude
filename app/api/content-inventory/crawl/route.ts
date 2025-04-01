// app/api/content-inventory/crawl/route.ts
import { NextResponse } from 'next/server';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ContentCrawler } from '../../../../utils/ContentCrawler';

interface CrawlRequestBody {
  siteUrl: string;
  maxPages?: number;
  followExternalLinks?: boolean;
  ignoreQueryParams?: boolean;
  excludePatterns?: string[];
  user_id: string;
}

export async function POST(req: Request) {
  try {
    const body: CrawlRequestBody = await req.json();
    const { siteUrl, maxPages, followExternalLinks, ignoreQueryParams, excludePatterns, user_id } =
      body;

    if (!siteUrl || !user_id) {
      return NextResponse.json({ error: 'Site URL and user ID are required' }, { status: 400 });
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found or not authenticated' }, { status: 401 });
    }

    // Create a content crawler instance
    const crawler = new ContentCrawler(supabase, user.id, siteUrl, {
      maxPages,
      followExternalLinks,
      ignoreQueryParams,
      excludePatterns,
    });

    crawler
      .crawl()
      .then((results) => {
        console.log(`Crawl completed for ${siteUrl}. Crawled ${results.length} pages.`);
      })
      .catch((error) => {
        console.error(`Crawl failed for ${siteUrl}:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Crawl started successfully',
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      {
        error: 'Failed to start crawl',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Endpoint to check crawl status
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get('siteUrl');
    const user_id = url.searchParams.get('user_id');
    if (!siteUrl) {
      return NextResponse.json({ error: 'Site URL is required' }, { status: 400 });
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get crawl status
    const { data, error } = await supabase
      .from('content_inventory')
      .select('id, page_url, title, last_crawled')
      .eq('user_id', user.id)
      .eq('site_url', siteUrl)
      .order('last_crawled', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retrieve crawl status', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pagesCount: data.length,
      lastCrawled: data.length > 0 ? data[0].last_crawled : null,
      pages: data,
    });
  } catch (error: any) {
    console.error('Error checking crawl status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check crawl status',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
