import { createClient } from '@supabase/supabase-js';
import { Anthropic } from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { scrapeUrls } from '@/utils/helpers/scraper';

const execAsync = promisify(exec);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

async function getTopSerps(keyword: string) {
  console.log('🔍 Fetching SERP results for keyword:', keyword);
  
  const response = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/advanced', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([{
      keyword,
      location_code: 2826,
      language_code: "en",
      device: "desktop",
      os: "windows",
      depth: 5  // Changed from 10 to 5
    }])
  });

  const data = await response.json();
  console.log('📊 SERP API Response:', {
    status: response.status,
    taskCount: data.tasks?.length,
    resultCount: data.tasks?.[0]?.result?.[0]?.items?.length
  });

  const urls = data.tasks?.[0]?.result?.[0]?.items
    ?.filter((item: any) => item.type === 'organic')
    ?.slice(0, 5)  // Changed from 10 to 5
    ?.map((item: any) => item.url) || [];

  console.log('🌐 Extracted URLs:', urls);
  return urls;
}

export async function POST(request: Request) {
  console.log('📝 Starting content recommendation process');
  
  try {
    const { keyword, user_id } = await request.json();
    console.log('🎯 Received keyword:', keyword, 'for user:', user_id);
    
    if (!keyword) {
      throw new Error('Keyword is required');
    }

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get top ranking URLs
    console.time('getTopSerps');
    const topUrls = await getTopSerps(keyword);
    console.timeEnd('getTopSerps');
    console.log(`✅ Found ${topUrls.length} URLs to analyze`);
    
    // Scrape content from URLs
    console.time('scrapeUrls');
    console.log('🕷️ Starting content scraping...');
    const scrapedContent = await scrapeUrls(topUrls);
    console.timeEnd('scrapeUrls');
    console.log(`📑 Scraped content length: ${scrapedContent.length} characters`);
    
    // Analyze with Claude
    console.time('claudeAnalysis');
    console.log('🤖 Starting Claude analysis...');
    const analysis = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4096,
      temperature: 0,
      system: `I am going to pass your the top 10 pieces of content that rank for a seed keyword. I need you to do the following for me:
        - Create a keyword cluster for the seed keyword
        - Create a Title and meta description
        -  Could you also do a 200 word content brief, make sure it explains the content to be written, ensure its conversational and also key things for the article
        - Determine the best content type from: [Informational, How to Guide, Explanatory Article, In Depth Analysis, Educational Content, Product/Service Page, Landing Page, Conversion Page, General Content]
        - Recommend a URL structure
        
        
        Please return as a json file in only this format, nothing else:
        {
          "seed_keyword": string,
          "secondary_keywords": string[],
          "meta_information": {
            "title": string,
            "description": string
          },
          "content_brief": {
            "summary": string,
            "key_points": string[]
          },
          "content_type": string,
          "url_structure": string
        }`,
      messages: [
        {
          role: "user",
          content: scrapedContent
        }
      ]
    }) as any;
    console.timeEnd('claudeAnalysis');
    console.log('✅ Claude analysis complete');

    // Store results in Supabase with provided user_id
    console.time('supabaseStore');
    console.log('💾 Storing results in Supabase...');
    
    const { data: contentRecommendation, error } = await supabase
      .from('content_recommendations')
      .insert({
        keyword,
        serp_urls: topUrls,
        analysis: JSON.parse(analysis.content[0].text),
        user_id, // Use the provided user_id
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    console.timeEnd('supabaseStore');
    console.log('✅ Results stored successfully');

    return new Response(JSON.stringify({
      success: true,
      data: contentRecommendation
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in content recommendation process:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate content recommendation',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
