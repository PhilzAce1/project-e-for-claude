import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({
            name,
            value,
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({
            name,
            value: '',
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value: '',
            ...options
          });
        }
      }
    }
  );

  return { supabase, response };
};

export const updateSession = async (request: NextRequest) => {
  try {
    const { supabase, response } = createClient(request);

    // Attempt to refresh the session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error refreshing session:', error);
      // If there's an error refreshing the session, clear it
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/signin/password_signin', request.url));
    }

    if (!session) {
      // If there's no session, redirect to sign in
      return NextResponse.redirect(new URL('/signin/password_signin', request.url));
    }

    // If we have a valid session, refresh it
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.error('Error refreshing session:', refreshError);
      // If there's an error refreshing the session, clear it and redirect
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/signin/password_signin', request.url));
    }

    return response;
  } catch (e) {
    console.error('Error in updateSession:', e);
    return NextResponse.redirect(new URL('/signin/password_signin', request.url));
  }
};
