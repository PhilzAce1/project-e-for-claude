import { createClient } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { supabase, response } = createClient(req);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is authenticated and trying to access the signin page, redirect to dashboard
  if (user && req.nextUrl.pathname === '/signin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If the user is not authenticated and trying to access a protected route, redirect to signin
  if (!user && (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/account')) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/', '/account', '/signin', '/site-audit'],
};
