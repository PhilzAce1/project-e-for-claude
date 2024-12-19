import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const maxDuration = 300;

export async function POST(req: Request) {
    console.log('Starting keyword enrichment process');
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        // Initialize Supabase client
        const supabase = createClientComponentClient({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
        });

        // Fetch seed keywords from our database
        console.log('Fetching seed keywords for user:', userId);
        const { data: seedKeywords, error: fetchError } = await supabase
            .from('seed_keyword_suggestions')
            .select('keyword')
            .eq('user_id', userId);

        if (fetchError) {
            console.error('Error fetching seed keywords:', fetchError);
            throw new Error('Failed to fetch seed keywords');
        }

        if (!seedKeywords?.length) {
            return NextResponse.json(
                { error: 'No seed keywords found' },
                { status: 404 }
            );
        }

        // Extract keywords into array
        const keywords = seedKeywords.map(k => k.keyword);
        console.log('Found keywords:', keywords.length);

        // Split keywords into chunks of 20 (DataForSEO limit)
        const keywordChunks = [];
        for (let i = 0; i < keywords.length; i += 20) {
            keywordChunks.push(keywords.slice(i, i + 20));
        }

        console.log('Split into chunks:', keywordChunks.length);

        // Initialize DataForSEO auth
        const dataForSeoAuth = Buffer.from(
            `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
        ).toString('base64');

        // Process each chunk
        for (const chunk of keywordChunks) {
            console.log('Processing chunk of', chunk.length, 'keywords');
            
            try {
                const response = await fetch('https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${dataForSeoAuth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        location_code: 2826, // UK
                        language_code: "en", // English
                        keywords: chunk
                    }])
                });

                if (!response.ok) {
                    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                const results = data?.tasks?.[0]?.result;
                
                if (!results) {
                    console.log('No results for chunk');
                    continue;
                }

                // Process and store results
                const keywordData = results.map((result: any) => ({
                    user_id: userId,
                    keyword: result.keyword,
                    search_volume: result.search_volume,
                    competition: result.competition,
                    competition_index: result.competition_index,
                    cpc: result.cpc,
                    monthly_searches: result.monthly_searches
                }));

                // Store in database
                const { error: insertError } = await supabase
                    .from('keyword_suggestions')
                    .insert(keywordData);

                if (insertError) {
                    console.error('Error inserting keyword data:', insertError);
                }

            } catch (error) {
                console.error('Error processing chunk:', error);
                // Continue with next chunk even if this one fails
            }

            // Respect rate limit (12 requests per minute)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        return NextResponse.json(
            { message: 'Keyword enrichment process completed' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error in keyword enrichment:', error);
        return NextResponse.json(
            { error: 'Failed to enrich keywords' },
            { status: 500 }
        );
    }
}
