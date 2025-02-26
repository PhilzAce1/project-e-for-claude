import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface KeywordSuggestion {
  keyword: string;
  search_volume: number;
  cpc: number | null;
  competition: string;
  competition_index: number;
  monthly_searches: MonthlySearch[];
  location_code: number;
  language_code: string;
}

export async function POST(request: Request) {
  console.log('API route hit');
  
  try {
    // Verify authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No user found');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyword } = body;
    
    console.log('Searching for keyword:', keyword);

    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      console.error('DataForSEO credentials not found');
      return new NextResponse(
        JSON.stringify({ error: 'Configuration error' }),
        { status: 500 }
      );
    }

    // Make request to DataForSEO
    const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.DATAFORSEO_LOGIN + ':' + process.env.DATAFORSEO_PASSWORD).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          "keywords": [keyword],
          "location_code": 2826, // UK
          "language_code": "en",
          "include_seed_keyword": true,
          "include_serp_info": false,
          "include_adult_keywords": false,
          "limit": 100
        }
      ])
    });

    const data = await response.json();
    console.log('DataForSEO response:', data.tasks?.[0]);

    // Transform the data to match our interface
    const suggestions: KeywordSuggestion[] = data.tasks?.[0]?.result?.map((item: any) => ({
      keyword: item?.keyword,
      search_volume: item?.search_volume || 0,
      cpc: item?.cpc || 0,
      competition: (() => {
        const competition = item?.competition_index || 0;
        if (competition >= 0.66) return 'HIGH';
        if (competition >= 0.33) return 'MEDIUM';
        return 'LOW';
      })(),
      competition_index: item?.competition_index || 0,
      monthly_searches: item?.monthly_searches?.map((search: any) => ({
        year: search.year,
        month: search.month,
        search_volume: search.search_volume
      })) || [],
      location_code: 2826, // UK
      language_code: "en"
    })) || [];

    return new NextResponse(
      JSON.stringify(suggestions),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Keyword suggestion error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: (error as Error).message }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 