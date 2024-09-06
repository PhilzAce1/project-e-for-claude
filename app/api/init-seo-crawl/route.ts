import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log('API route called')
    const supabase = createRouteHandlerClient({ cookies })
    const { domain, userId } = await request.json()
    console.log('Received data:', { domain, userId })

    try {
        console.log('Invoking Supabase function...')
        const { data, error } = await supabase.functions.invoke('init-seo-crawl', {
            body: JSON.stringify({ domain, userId }),
        })

        if (error) {
            console.error('Supabase function error:', error)
            throw error
        }

        console.log('Supabase function response:', data)
        return NextResponse.json({ message: 'SEO crawl initiated successfully', data }, { status: 200 })
    } catch (error) {
        console.error('Error initiating SEO crawl:', error)
        return NextResponse.json({ error: 'Failed to initiate SEO crawl', details: error }, { status: 500 })
    }
}
