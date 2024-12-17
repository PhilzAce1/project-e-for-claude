import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        const { domain, analysisId, userId } = await request.json();
        
        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
        }

        // Get user session
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Start analysis in the background
        console.log('Starting analysis for domain:', domain);
        await gatherBusinessInformation(domain, analysisId, supabase, userId).catch(console.error);

        // Return immediately with the analysis ID
        return NextResponse.json({
            success: true,
            data: {
                analysisId: analysisId
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