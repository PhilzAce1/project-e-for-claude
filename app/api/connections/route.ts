// Get all connections for a user
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getAllGoogleConnections } from './authenticate/route';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify user authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get all connections for the authenticated user
    const connections = await getAllGoogleConnections(supabase, user.id);

    return NextResponse.json({
      success: true,
      connections
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch connections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
