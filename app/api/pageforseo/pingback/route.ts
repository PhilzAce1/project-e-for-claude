import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabase = createRouteHandlerClient({ cookies })

export async function POST(request: Request) {
    try {
        const data = await request.json()
        console.log('Received pingback data:', data)

        // Verify the pingback data (you might want to add more verification)
        if (!data.task_id || !data.status) {
            return NextResponse.json({ error: 'Invalid pingback data' }, { status: 400 })
        }

        // // Update the seo_crawls table with the new status
        // const { error } = await supabase
        //     .from('seo_crawls')
        //     .update({ status: data.status })
        //     .eq('external_job_id', data.task_id)

        // if (error) {
        //     console.error('Error updating seo_crawls:', error)
        //     return NextResponse.json({ error: 'Failed to update crawl status' }, { status: 500 })
        // }

        // If the status is 'complete', you might want to trigger some additional processing here

        return NextResponse.json({ message: 'Crawl status updated successfully' }, { status: 200 })
    } catch (error) {
        console.error('Error in pingback route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}