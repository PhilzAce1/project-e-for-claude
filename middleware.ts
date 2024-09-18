import {createMiddlewareClient} from '@supabase/auth-helpers-nextjs'
import {NextResponse} from 'next/server'
import type {NextRequest}
from 'next/server'

// Define public paths that don't require authentication
const publicPaths = [
    '/auth/reset_password',
    '/signin/confirm_email', 
    '/signin/password_signin',
    '/signin/update_password',
    '/signin/forgot_password',
    '/signin/signup',
    '/auth/callback'
]

export async function middleware(req : NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({req, res})

    const {data: {
            user
        }} = await supabase
        .auth
        .getUser()

    const path = req.nextUrl.pathname

    // Allow access to public paths without authentication
    if (publicPaths.includes(path)) {
        return res
    }

    // If user is not authenticated and trying to access a protected route, redirect
    // to login
    if (!user && !publicPaths.includes(path)) {
        return NextResponse.redirect(new URL('/signin/password_signin', req.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
