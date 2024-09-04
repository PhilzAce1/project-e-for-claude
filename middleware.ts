import { createClient } from '@/utils/supabase/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { supabase } = createClient(req);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is authenticated and trying to access a public route, redirect to dashboard
  if (user && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If the user is not authenticated and trying to access a protected route, redirect to signin
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
