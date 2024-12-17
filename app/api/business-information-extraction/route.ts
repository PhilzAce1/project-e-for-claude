import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        const { domain, analysisId, userId } = await request.json();
        
        if (!domain || !analysisId || !userId) {
            return NextResponse.json({ 
                error: 'Domain, analysisId, and userId are required' 
            }, { status: 400 });
        }

        // Create the service role client
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Start analysis
        console.log('Starting analysis for domain:', domain);
        await gatherBusinessInformation(domain, analysisId, supabase, userId);

        return NextResponse.json({
            success: true,
            data: {
                analysisId
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error analyzing website:', error);
        return NextResponse.json({ 
            success: false,
            error: error.message || 'Failed to analyze website'
        }, { status: 500 });
    }
}