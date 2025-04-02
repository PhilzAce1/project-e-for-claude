import { NextResponse } from 'next/server';
import { gatherBusinessInformation } from '@/utils/business-analyzer';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { domain, analysisId, userId } = await request.json();

    if (!domain || !analysisId || !userId) {
      return NextResponse.json(
        {
          error: 'Domain, analysisId, and userId are required',
        },
        { status: 400 },
      );
    }

    // Create a service role client instead of using cookies
    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    await gatherBusinessInformation(domain, analysisId, supabase, userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          analysisId,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze website',
      },
      { status: 500 },
    );
  }
}
