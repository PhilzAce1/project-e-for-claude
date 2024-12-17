import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const maxDuration = 300;

export async function POST(request: Request) {
    try {
        const { domain, analysisId, userId } = await request.json();
        
        if (!domain || !analysisId || !userId) {
            return NextResponse.json({ 
                error: 'Domain, analysisId, and userId are required' 
            }, { status: 400 });
        }

        // Get user session
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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