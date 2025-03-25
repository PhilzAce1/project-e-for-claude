// app/api/connections/accounts/route.ts
import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Create OAuth client
const createOAuth2Client = (): OAuth2Client => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing Google OAuth credentials');
  }
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const service = url.searchParams.get('service');

    // New parameters for token-based authentication
    const accessToken = url.searchParams.get('accessToken');
    const refreshToken = url.searchParams.get('refreshToken');

    if (!service) {
      return NextResponse.json({ error: 'Missing service parameter' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const oauth2Client = createOAuth2Client();

    // If tokens are provided directly, use them
    if (accessToken && refreshToken) {
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else {
      // Otherwise get tokens from the database
      const tableName = getTableName(service);
      const { data: connectionData, error: connectionError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (connectionError || !connectionData) {
        return NextResponse.json({ error: `${service} is not connected` }, { status: 404 });
      }

      oauth2Client.setCredentials({
        access_token: connectionData.access_token,
        refresh_token: connectionData.refresh_token,
      });
    }

    try {
      let accounts = [];

      switch (service) {
        case 'tagManager': {
          const tagmanager = google.tagmanager('v2');
          const response = await tagmanager.accounts.list({
            auth: oauth2Client,
          });

          accounts = response.data.account || [];
          break;
        }

        case 'searchConsole': {
          // Google Search Console doesn't have a concept of accounts
          // We'll return the sites directly as "accounts" for a consistent interface
          const webmasters = google.webmasters('v3');
          const { data } = await webmasters.sites.list({
            auth: oauth2Client,
          });

          // Format sites as accounts for consistency in the UI
          accounts =
            data.siteEntry?.map((site) => ({
              id: site.siteUrl,
              name: site.siteUrl,
              displayName: site.siteUrl,
            })) || [];
          break;
        }

        case 'analytics': {
          const analyticsAdmin = google.analyticsadmin('v1beta');
          const response = await analyticsAdmin.accounts.list({
            auth: oauth2Client,
          });

          // For debugging
          console.log(
            'Google Analytics accounts raw response:',
            JSON.stringify(response.data, null, 2),
          );

          accounts = response.data.accounts || [];

          // Ensure each account has an id field for consistent handling in the UI
          accounts = accounts.map((account) => {
            // Extract the numeric ID from the name (format: "accounts/12345")
            const accountId = account.name ? account.name.split('/').pop() : '';
            return {
              ...account,
              // Add an explicit id field if it doesn't exist
              id: accountId || '',
              // Ensure we have a displayName for the UI
              displayName: account.displayName || `Account ${accountId}` || 'Unknown Account',
            };
          });

          console.log('Processed Google Analytics accounts:', accounts);
          break;
        }

        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      return NextResponse.json({
        success: true,
        accounts,
      });
    } catch (error: any) {
      // Check if token is expired and needs refresh
      if (error.response?.status === 401 && !accessToken) {
        try {
          // Only attempt token refresh if we got tokens from the database
          const tableName = getTableName(service);
          const { credentials } = await oauth2Client.refreshAccessToken();

          if (!credentials || !credentials.access_token) {
            return NextResponse.json(
              {
                success: false,
                error: `Authentication expired. Please reconnect ${service}.`,
                requiresReconnection: true,
              },
              { status: 401 },
            );
          }

          // Update the token in database
          await supabase
            .from(tableName)
            .update({
              access_token: credentials.access_token,
              expires_at: credentials.expiry_date
                ? new Date(credentials.expiry_date).toISOString()
                : null,
            })
            .eq('user_id', user.id);

          // Return error asking client to retry
          return NextResponse.json(
            {
              success: false,
              error: 'Token refreshed. Please retry your request.',
              shouldRetry: true,
            },
            { status: 200 },
          );
        } catch (refreshError) {
          return NextResponse.json(
            {
              success: false,
              error: `Authentication expired. Please reconnect ${service}.`,
              requiresReconnection: true,
            },
            { status: 401 },
          );
        }
      }

      // Handle other errors
      console.error(`Error fetching ${service} accounts:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch ${service} accounts`,
          details: error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in accounts API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

function getTableName(service: string): string {
  switch (service) {
    case 'tagManager':
      return 'gtm_connections';
    case 'searchConsole':
      return 'gsc_connections';
    case 'analytics':
      return 'ga_connections';
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}
