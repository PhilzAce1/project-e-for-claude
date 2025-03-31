// app/api/connections/properties/route.ts
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
    const accountId = url.searchParams.get('accountId');

    // New parameters for token-based authentication
    const accessToken = url.searchParams.get('accessToken');
    const refreshToken = url.searchParams.get('refreshToken');

    if (!service || !accountId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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
      let properties: any[] = [];

      switch (service) {
        case 'tagManager': {
          const tagmanager = google.tagmanager('v2');
          const containers = await tagmanager.accounts.containers.list({
            parent: `accounts/${accountId}`,
            auth: oauth2Client,
          });

          properties = containers.data.container || [];
          break;
        }

        case 'searchConsole': {
          // For Search Console, the accountId is actually the siteUrl
          // Since there are no sub-properties under a site, return an empty array
          // The UI will not show a property selection for Search Console
          break;
        }

        case 'analytics': {
          const analyticsAdmin = google.analyticsadmin('v1beta');

          // Check if accountId already has the "accounts/" prefix
          const formattedAccountId = accountId.startsWith('accounts/')
            ? accountId
            : `accounts/${accountId}`;

          const propertiesResponse = await analyticsAdmin.properties.list({
            auth: oauth2Client,
            // The filter format should be "parent:accounts/123456"
            filter: `parent:${formattedAccountId}`,
          });

          properties = propertiesResponse.data.properties || [];
          break;
        }

        default:
          throw new Error(`Unsupported service: ${service}`);
      }

      return NextResponse.json({
        success: true,
        properties,
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

      console.error(`Error fetching ${service} properties:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch ${service} properties`,
          details: error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in properties API:', error);
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
