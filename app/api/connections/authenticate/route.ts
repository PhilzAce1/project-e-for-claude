import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Create OAuth client
const createOAuth2Client = (redirect_uri: string): OAuth2Client => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirect_uri);
};

export async function POST(req: Request) {
  try {
    const { code, service, redirect_uri } = await req.json();

    if (!code || !service || !redirect_uri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (await isGoogleServiceConnected(supabase, user.id, service)) {
      return NextResponse.json(
        { message: `${service} is already connected`, isConnected: true },
        { status: 200 }
      );
    }

    const oauth2Client = createOAuth2Client(redirect_uri);
    let tokens;

    try {
      const { tokens: receivedTokens } = await oauth2Client.getToken(code);
      tokens = receivedTokens;

      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });

      const expiresAt = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

      const oauth2 = google.oauth2('v2');
      const userInfo = await oauth2.userinfo.get({
        auth: oauth2Client
      });

      const googleEmail = userInfo.data.email;

      let connectionData: any = {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt?.toISOString(),
        email: googleEmail
      };

      try {
        switch (service) {
          case 'tagManager': {
            const tagmanager = google.tagmanager('v2');
            const accounts = await tagmanager.accounts.list({
              auth: oauth2Client
            });

            if (accounts.data.account && accounts.data.account.length > 0) {
              const account = accounts.data.account[0];
              if (account.path) {
                const containers = await tagmanager.accounts.containers.list({
                  parent: account.path,
                  auth: oauth2Client
                });

                connectionData = {
                  ...connectionData,
                  account_id: account.accountId,
                  container_id: containers.data.container?.[0]?.containerId
                };

                await supabase
                  .from('gtm_connections')
                  .upsert({
                    user_id: user.id,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: expiresAt?.toISOString()
                  })
                  .eq('user_id', user.id);
              }
            }
            break;
          }

          case 'searchConsole': {
            const webmasters = google.webmasters('v3');
            const { data } = await webmasters.sites.list({
              auth: oauth2Client
            });

            connectionData = {
              ...connectionData,
              sites: data.siteEntry?.map((site) => site.siteUrl) || []
            };

            console.log('🔍 connectionData', connectionData);
            const { error, data: newConnection } = await supabase
              .from('gsc_connections')
              .upsert({
                user_id: user.id,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt?.toISOString()
              })
              .eq('user_id', user.id);

            if (error) {
              console.error('Error inserting GSC connection:', error);
            } else {
              console.log('GSC connection inserted:', newConnection);
            }
            break;
          }

          case 'analytics': {
            const analyticsAdmin = google.analyticsadmin('v1beta');
            const accounts = await analyticsAdmin.accounts.list({
              auth: oauth2Client
            });

            if (accounts.data.accounts && accounts.data.accounts.length > 0) {
              const account = accounts.data.accounts[0];

              if (account.name) {
                const properties = await analyticsAdmin.properties.list({
                  auth: oauth2Client,
                  filter: `parent:${account.name}`
                });

                connectionData = {
                  ...connectionData,
                  account_id: account.name.split('/').pop(),
                  property_id: properties.data.properties?.[0]?.name
                    ?.split('/')
                    .pop()
                };

                await supabase
                  .from('ga_connections')
                  .upsert({
                    user_id: user.id,
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expires_at: expiresAt?.toISOString()
                  })
                  .eq('user_id', user.id);
              }
            }
            break;
          }

          default:
            throw new Error(`Unsupported service: ${service}`);
        }

        return NextResponse.json({
          success: true,
          service,
          email: googleEmail,
          ...connectionData
        });
      } catch (error: any) {
        console.error(`Error handling ${service} connection:`, error);

        // Try to rollback if needed
        try {
          const tableName =
            service === 'tagManager'
              ? 'gtm_connections'
              : service === 'searchConsole'
                ? 'gsc_connections'
                : 'ga_connections';

          await supabase.from(tableName).delete().eq('user_id', user.id);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to setup service connection',
            details: error.message
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          error: 'Failed to authenticate with Google',
          details: error.message,
          response: error.response?.data
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in authenticate:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

// Get user's Google Search Console connections
async function getGSCConnections(supabase: any, userId: string) {
  const isConnected = await isGoogleServiceConnected(
    supabase,
    userId,
    'searchConsole'
  );

  console.log('IS CONNECTED', isConnected, userId);
  if (!isConnected) {
    return null;
  }

  const { data, error } = await supabase
    .from('gsc_connections')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching GSC connections:', error);
    return null;
  }

  return data;
}

// Get user's Google Tag Manager connections
async function getGTMConnections(supabase: any, userId: string) {
  const isConnected = await isGoogleServiceConnected(
    supabase,
    userId,
    'tagManager'
  );
  if (!isConnected) {
    return null;
  }

  const { data, error } = await supabase
    .from('gtm_connections')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching GTM connections:', error);
    return null;
  }

  return data;
}

// Get user's Google Analytics connections
async function getGAConnections(supabase: any, userId: string) {
  const isConnected = await isGoogleServiceConnected(
    supabase,
    userId,
    'analytics'
  );
  if (!isConnected) {
    return null;
  }

  const { data, error } = await supabase
    .from('ga_connections')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching GA connections:', error);
    return null;
  }

  return data;
}

async function isGoogleServiceConnected(
  supabase: any,
  userId: string,
  service: string
) {
  let tableName;
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
      throw new Error('Invalid service');
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return false;
  }

  if (data.expires_at) {
    const expiryDate = new Date(data.expires_at);
    const currentDate = new Date();
    if (expiryDate.getTime() < currentDate.getTime()) {
      try {
        const { error: deleteError, data: deletedData } = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error(
            `Error deleting expired token from ${tableName}:`,
            deleteError
          );
        } else {
          console.log(
            `Successfully deleted expired token from ${tableName} for user ${userId}`,
            deletedData
          );
        }
      } catch (deleteException) {
        console.error(
          `Exception when deleting expired token from ${tableName}:`,
          deleteException
        );
      }
      return false;
    }
  }

  return true;
}

 async function getAllGoogleConnections(supabase: any, userId: string) {
  const [gsc, gtm, ga] = await Promise.all([
    getGSCConnections(supabase, userId),
    getGTMConnections(supabase, userId),
    getGAConnections(supabase, userId)
  ]);

  return {
    searchConsole: gsc?.[0] || null,
    tagManager: gtm?.[0] || null,
    analytics: ga?.[0] || null
  };
}

export { getAllGoogleConnections };
