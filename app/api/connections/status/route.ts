import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Fetch user's Google connections from the database
    const { data, error } = await supabase
      .from('users')
      .select('google_connections')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching Google connections:', error);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }
    
    // Format response with connection status
    const connections = data?.google_connections || {};
    
    return NextResponse.json({
      analytics: {
        connected: !!connections?.analytics?.accessToken,
        accountName: connections?.analytics?.accountName || null
      },
      tagManager: {
        connected: !!connections?.tagManager?.accessToken,
        accountName: connections?.tagManager?.accountName || null
      },
      googleAds: {
        connected: !!connections?.googleAds?.accessToken,
        accountName: connections?.googleAds?.accountName || null
      }
    });
  } catch (error) {
    console.error('Unexpected error in connections status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 