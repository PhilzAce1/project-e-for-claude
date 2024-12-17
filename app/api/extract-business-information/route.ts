import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        const { domain, userId } = await request.json();
        
        if (!domain || !userId) {
            return NextResponse.json({ error: 'Domain and userId are required' }, { status: 400 });
        }

        // Create the service role client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Create initial records
        const { data: scrape, error: scrapeError } = await supabase
            .from('website_scrapes')
            .insert({
                domain,
                user_id: userId,
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
                user_id: userId,
                scrape_id: scrape.id,
                status: 'pending',
                progress: 'Initializing analysis...'
            })
            .select()
            .single();

        if (analysisError) {
            throw new Error(`Failed to create analysis record: ${analysisError.message}`);
        }

        // Start analysis in the background using a POST request
        console.log('Starting analysis for domain:', domain);
        
        // Use await to ensure the request is sent before the function returns
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/business-information-extraction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain,
                analysisId: analysis.id,
                userId
            })
        }).catch(error => {
            console.error('Error starting analysis:', error);
            throw error;
        });

        // Return immediately with the analysis ID
        return NextResponse.json({
            success: true,
            data: {
                analysisId: analysis.id
            }
        }, { status: 202 });

    } catch (error: any) {
        console.error('Error analyzing website:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to analyze website'
        }, { status: 500 });
    }
}