// app/api/connections/finalize/route.ts
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

interface FinalizeRequestBody {
  accessToken: string;
  refreshToken: string;
  service: string;
  accountId: string;
  propertyId?: string;
}

export async function POST(req: Request) {
  try {
    const body: FinalizeRequestBody = await req.json();

    const { accessToken, refreshToken, service, accountId, propertyId } = body;

    if (!accessToken || !refreshToken || !service || !accountId) {
      console.error('Missing required parameters:', {
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        service,
        accountId,
      });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const oauth2Client = createOAuth2Client();

    // Use provided tokens instead of exchanging code
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    try {
      // Get Google user info
      const oauth2 = google.oauth2('v2');
      const userInfo = await oauth2.userinfo.get({
        auth: oauth2Client,
      });

      const googleEmail = userInfo.data.email;

      // Get token expiry by requesting token info
      const tokenInfoResponse = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
      );
      const tokenInfo = await tokenInfoResponse.json();
      const expiresIn = tokenInfo.expires_in || 3600; // Default to 1 hour if not provided
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Base connection data
      let connectionData: Record<string, any> = {
        user_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt.toISOString(),
        ...(service !== 'searchConsole' && { account_id: accountId }),
      };

      // Add property ID if it exists

      const tableName = getTableName(service);

      try {
        // Store the selected account and property information
        switch (service) {
          case 'tagManager': {
            const tagmanager = google.tagmanager('v2');
            // Validate the container exists
            if (propertyId) {
              await tagmanager.accounts.containers.get({
                path: `accounts/${accountId}/containers/${propertyId}`,
                auth: oauth2Client,
              });

              connectionData.container_id = propertyId;
            }
            break;
          }

          case 'searchConsole': {
            const webmasters = google.webmasters('v3');

            // if (propertyId) {
            //   connectionData.property_id = propertyId;
            // }
            // For Search Console, the accountId is actually the siteUrl
            // Validate the site exists
            await webmasters.sites.get({
              siteUrl: accountId,
              auth: oauth2Client,
            });

            // connectionData.site_url = accountId;
            break;
          }

          case 'analytics': {
            const analyticsAdmin = google.analyticsadmin('v1beta');
            // Validate the property exists if one was selected
            if (propertyId) {
              await analyticsAdmin.properties.get({
                name: `properties/${propertyId}`,
                auth: oauth2Client,
              });
            }
            break;
          }

          default:
            throw new Error(`Unsupported service: ${service}`);
        }

        // Upsert the connection data

        const { error } = await supabase
          .from(tableName)
          .upsert(connectionData)
          .eq('user_id', user.id);

        if (error) {
          console.error(`Error storing ${service} connection:`, error);
          throw new Error(`Error storing ${service} connection: ${error.message}`);
        }

        return NextResponse.json({
          success: true,
          connection: connectionData,
        });
      } catch (error: any) {
        console.error(`Error handling ${service} connection:`, error);

        // Try to rollback if needed
        try {
          await supabase.from(tableName).delete().eq('user_id', user.id);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        return NextResponse.json(
          {
            success: false,
            error: `Failed to setup service connection: ${error.message}`,
          },
          { status: 500 },
        );
      }
    } catch (error: any) {
      console.error('Failed to authenticate with Google:', error);
      return NextResponse.json(
        {
          error: 'Failed to authenticate with Google',
          details: error.message,
          response: error.response?.data,
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in finalize connection:', error);
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
      console.error('Unknown service:', service);
      throw new Error(`Unknown service: ${service}`);
  }
}
