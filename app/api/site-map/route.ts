import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { discoverAndScrapeSitemap } from '@/utils/site-map-helper';


export async function POST(request: Request) {
  try {
    const { domain, maxPages, userId } = await request.json();

 

    const supabase = createClientComponentClient({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

    if (error || !user || !user?.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Invalid domain provided or username' }, { status: 400 });
    }
    
    const scrapedPages = await discoverAndScrapeSitemap(domain, maxPages || 200, user.id);
    
    return NextResponse.json({ 
      message: 'Sitemap discovered and scraped successfully', 
      pagesFound: scrapedPages.length, 
      scrapedPages
    }, { status: 200 });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}