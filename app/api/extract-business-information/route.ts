import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { domain } = await request.json();
        
        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Get user session
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create initial records
        const { data: scrape, error: scrapeError } = await supabase
            .from('website_scrapes')
            .insert({
                domain,
                user_id: user.id,
                status: 'processing'
            })
            .select()
            .single();

        if (scrapeError) {
            throw new Error(`Failed to create scrape record: ${scrapeError.message}`);
        }

        const { data: analysis, error: analysisError } = await supabase
            .from('business_analyses')
            .insert({
                domain,
                user_id: user.id,
                scrape_id: scrape.id,
                status: 'pending',
                progress: 'Initializing analysis...'
            })
            .select()
            .single();

        if (analysisError) {
            throw new Error(`Failed to create analysis record: ${analysisError.message}`);
        }

        // Start analysis in the background
        console.log('Starting analysis for domain:', domain);
        gatherBusinessInformation(domain, analysis.id, supabase).catch(console.error);

        // Return immediately with the analysis ID
        return NextResponse.json({
            success: true,
            data: {
                analysisId: analysis.id
            }
        });

    } catch (error: any) {
        console.error('Error analyzing website:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to analyze website'
        }, { status: 500 });
    }
}