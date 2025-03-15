import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function submitUrlForIndexing(url: string, accessToken: string) {
  const endpoint =
    'https://indexing.googleapis.com/v3/urlNotifications:publish';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Indexing API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting URL for indexing:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { url, title, status, priority, change_frequency, description } =
      await req.json();

    // Get authenticated user
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Insert new content
    const { data: newContent, error: contentError } = await supabase
      .from('content')
      .insert([
        {
          user_id: user.id,
          url,
          title,
          status,
          priority,
          change_frequency,
          description,
          site_indexed: false,
          last_modified: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (contentError) {
      return NextResponse.json(
        { error: 'Failed to create content' },
        { status: 500 }
      );
    }

    // Get GSC access token for indexing
    const { data: gscConnection, error: gscError } = await supabase
      .from('gsc_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    // If we have GSC connection, submit for indexing
    if (gscConnection?.access_token) {
      try {
        const indexingResult = await submitUrlForIndexing(
          url,
          gscConnection.access_token
        );
        return NextResponse.json({
          success: true,
          content: newContent,
          indexingStatus: indexingResult
        });
      } catch (indexError) {
        console.error('Failed to submit for indexing:', indexError);
        return NextResponse.json({
          success: true,
          content: newContent,
          indexingError: 'Failed to submit for indexing'
        });
      }
    }

    return NextResponse.json({
      success: true,
      content: newContent
    });
  } catch (error) {
    console.error('Error in content creation:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
