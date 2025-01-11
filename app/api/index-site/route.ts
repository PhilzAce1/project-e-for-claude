import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';

const SEARCH_ENGINES = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://searchadvisor.naver.com/indexnow',
  'https://search.seznam.cz/indexnow',
  'https://yandex.com/indexnow',
  'https://indexnow.yep.com/indexnow'
];

export async function POST(request: Request) {
  try {
    const { url, contentId } = await request.json();
    
    if (!url || !contentId) {
      throw new Error('URL and contentId are required');
    }

    // Submit to IndexNow search engines
    const indexNowPromises = SEARCH_ENGINES.map(engine => 
      fetch(`${engine}?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.error(`Failed to submit to ${engine}:`, error);
        return null;
      })
    );

    const results = await Promise.all(indexNowPromises);
    const anySuccess = results.some(result => result && result.ok);

    if (anySuccess) {
      // Update the content table
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });
      const { error: updateError } = await supabase
        .from('content')
        .update({ site_indexed: true })
        .eq('id', contentId);

      if (updateError) {
        console.error('Failed to update content record:', updateError);
      }
      console.log('Content record updated successfully');
    }

    return new Response(JSON.stringify({ 
      success: true,
      contentId,
      indexNowSuccess: anySuccess
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Indexing API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit URL',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
