// app/api/content-inventory/analytics/route.ts
import { NextResponse } from 'next/server';
import {
  createClientComponentClient,
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { AnalyticsIntegration } from '../../../../utils/AnalyticsIntegration';
import { getGoogleConnection } from '../../../../utils/googleAuth';

interface UpdateAnalyticsRequestBody {
  days?: number;
  user_id: string;
}

export async function POST(req: Request) {
  try {
    const body: UpdateAnalyticsRequestBody = await req.json();
    const { days = 30, user_id } = body;

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found or not authenticated' }, { status: 401 });
    }

    // Get GA connection
    const gaConnection = await getGoogleConnection(supabase, user.id, 'analytics');

    if (!gaConnection) {
      return NextResponse.json({ error: 'No Google Analytics connection found' }, { status: 400 });
    }

    // Initialize analytics integration
    const analytics = new AnalyticsIntegration(supabase, user.id);
    const initialized = await analytics.initialize();

    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize analytics integration' },
        { status: 500 },
      );
    }

    // Start updating analytics in the background
    const propertyId = gaConnection.property_id;

    if (!propertyId) {
      return NextResponse.json({ error: 'No Google Analytics property ID found' }, { status: 400 });
    }

    // Update analytics in the background
    analytics
      .updateAllContentAnalytics(propertyId, days)
      .then((success) => {
        console.log(`Analytics update ${success ? 'completed' : 'failed'} for user ${user.id}.`);
      })
      .catch((error) => {
        console.error(`Analytics update failed:`, error);
      });

    return NextResponse.json({
      success: true,
      message: 'Analytics update started successfully',
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Error starting analytics update:', error);
    return NextResponse.json(
      {
        error: 'Failed to start analytics update',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// Get analytics for content
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const contentId = url.searchParams.get('contentId');
    const days = url.searchParams.get('days') ? parseInt(url.searchParams.get('days')!) : 30;

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify the content belongs to the user
    const { data: contentData, error: contentError } = await supabase
      .from('content_inventory')
      .select('id')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !contentData) {
      return NextResponse.json({ error: 'Content not found or access denied' }, { status: 404 });
    }

    // Initialize analytics integration
    const analytics = new AnalyticsIntegration(supabase, user.id);

    // Get analytics data
    const analyticsData = await analytics.getContentAnalytics(contentId, days);

    // Calculate performance score
    const performanceScore = await analytics.calculateContentPerformanceScore(contentId);

    return NextResponse.json({
      success: true,
      analytics: analyticsData,
      performanceScore,
    });
  } catch (error: any) {
    console.error('Error retrieving analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
