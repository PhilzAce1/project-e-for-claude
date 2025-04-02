// utils/googleAuth.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Create OAuth client
const createOAuth2Client = (): OAuth2Client => {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
};

/**
 * Refreshes the Google access token if needed
 */
export async function refreshGoogleToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: string | null,
  service: 'tagManager' | 'searchConsole' | 'analytics',
  userId: string,
  supabase: SupabaseClient,
): Promise<OAuth2Client> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Check if token is expired or about to expire
  const isExpired = expiresAt && new Date(expiresAt) <= new Date();

  if (isExpired && refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      const newExpiresAt = credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null;

      // Update the token in the database
      const tableName = getTableNameForService(service);
      await supabase
        .from(tableName)
        .update({
          access_token: credentials.access_token,
          expires_at: newExpiresAt,
        })
        .eq('user_id', userId);

      // Set the new credentials
      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: refreshToken, // Keep the existing refresh token
        expiry_date: credentials.expiry_date,
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh Google token');
    }
  }

  return oauth2Client;
}

/**
 * Gets Google connection based on service type
 */
export async function getGoogleConnection(
  supabase: SupabaseClient,
  userId: string,
  service: 'tagManager' | 'searchConsole' | 'analytics',
) {
  const tableName = getTableNameForService(service);

  const { data, error } = await supabase.from(tableName).select('*').eq('user_id', userId).single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Check if a Google service is connected
 */
export async function isGoogleServiceConnected(
  supabase: SupabaseClient,
  userId: string,
  service: 'tagManager' | 'searchConsole' | 'analytics',
): Promise<boolean> {
  const connection = await getGoogleConnection(supabase, userId, service);
  return !!connection;
}

/**
 * Get all Google connections for a user
 */
export async function getAllGoogleConnections(supabase: SupabaseClient, userId: string) {
  const [gtmResult, gscResult, gaResult] = await Promise.all([
    supabase.from('gtm_connections').select('*').eq('user_id', userId).single(),
    supabase.from('gsc_connections').select('*').eq('user_id', userId).single(),
    supabase.from('ga_connections').select('*').eq('user_id', userId).single(),
  ]);

  return {
    tagManager: gtmResult.data || null,
    searchConsole: gscResult.data || null,
    analytics: gaResult.data || null,
  };
}

// Helper function to get the table name for a service
function getTableNameForService(service: 'tagManager' | 'searchConsole' | 'analytics'): string {
  switch (service) {
    case 'tagManager':
      return 'gtm_connections';
    case 'searchConsole':
      return 'gsc_connections';
    case 'analytics':
      return 'ga_connections';
  }
}
