import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { service } = await req.json();

    const validServices = ['tagManager', 'searchConsole', 'analytics'];
    if (!service || !validServices.includes(service)) {
      return NextResponse.json(
        { error: 'Invalid or missing service parameter' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Determine the correct table name based on service
    let tableName: string;
    switch (service) {
      case 'tagManager':
        tableName = 'gtm_connections';
        break;
      case 'searchConsole':
        tableName = 'gsc_connections';
        break;
      case 'analytics':
        tableName = 'ga_connections';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid service specified' },
          { status: 400 }
        );
    }
    // Delete the connection
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error disconnecting service:', deleteError);
      return NextResponse.json(
        { error: `Failed to disconnect ${service}: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected from ${service}`
    });
  } catch (error) {
    console.error('Unexpected error in disconnect:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
