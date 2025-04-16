import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        getErrorRedirect(
          `${requestUrl.origin}/signin/password_signin`,
          error.name,
          "Sorry, we weren't able to log you in. Please try again.",
        ),
      );
    }

    // If the exchange was successful, the user is now signed in
    if (data.session) {
      // Check if user was just created (within the last minute)
      if (data.user && data.user.created_at) {
        const createdAt = new Date(data.user.created_at);
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

        if (createdAt > oneMinuteAgo) {
          // This is a new user, redirect to welcome page
          return NextResponse.redirect(`${requestUrl.origin}/welcome`);
        }
      }
      // Redirect to the dashboard for existing users
      return NextResponse.redirect(`${requestUrl.origin}/`);
    }
  }

  // If there's no code or the exchange wasn't successful, redirect to the sign-in page
  return NextResponse.redirect(`${requestUrl.origin}/signin/password_signin`);
}
