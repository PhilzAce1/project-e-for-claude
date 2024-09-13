import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const taskId = url.searchParams.get('id')
        const tag = url.searchParams.get('tag')

        console.log('Received pingback data:', { taskId, tag })

        if (!taskId) {
            return NextResponse.json({ error: 'Invalid pingback data' }, { status: 400 })
        }

        if (tag === 'lighthouse_audit') {
            // Handle Lighthouse data
            const lighthouseData = await fetchLighthouseData(taskId)
            await saveLighthouseData(taskId, lighthouseData)
        } else {
            // Handle SEO crawl data
            const summaryData = await fetchSummaryData(taskId)
            const scrapedPagesData = await fetchScrapedPages(taskId)
            await saveSEOCrawlData(taskId, summaryData, scrapedPagesData)
        }

        return NextResponse.json({ message: 'Data saved successfully' }, { status: 200 })
    } catch (error) {
        console.error('Error in pingback route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

async function fetchLighthouseData(taskId: string) {
    const apiUrl = `https://api.dataforseo.com/v3/on_page/lighthouse/task_get/json/${taskId}`
    const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')
    
    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Basic ${auth}` }
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Lighthouse data:', data.tasks[0].result[0])
    return data.tasks[0].result[0]
}

async function saveLighthouseData(taskId: string, lighthouseData: any) {
    const { data, error } = await serviceRoleClient
        .from('seo_crawls')
        .update({
            lighthouse_data: lighthouseData,
        })
        .eq('lighthouse_task_id', taskId.toString())

    if (error) {
        console.error('Error saving Lighthouse data:', error)
        throw error
    }

    console.log('Lighthouse data saved successfully')
}

async function fetchScrapedPages(taskId: string) {
    const apiUrl = 'https://api.dataforseo.com/v3/on_page/pages'
    const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')
    
    const postData = [{
        id: taskId,
        filters: [
            ["resource_type", "=", "html"]
        ],
        limit: 100  // Adjust this value as needed
    }]

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Scraped pages data:', data, data.tasks[0].result)
    return data.tasks[0].result
}

async function saveSEOCrawlData(taskId: string, summaryData: any, scrapedPagesData: any) {
    const { crawl_progress, domain_info, page_metrics } = summaryData

    console.log('Attempting to update row with external_job_id:', taskId)

    const { data, error } = await serviceRoleClient
        .from('seo_crawls')
        .update({
            total_pages: domain_info.total_pages,
            onpage_score: page_metrics.onpage_score,
            page_metrics: page_metrics,
            scraped_pages: scrapedPagesData[0].items
        })
        .eq('external_job_id', taskId.toString())

    if (error) {
        console.error('Error updating seo_crawls:', error)
        throw error
    }

    console.log('Update result:', data)
}

async function fetchSummaryData(taskId: string) {
    const apiUrl = `https://api.dataforseo.com/v3/on_page/summary/${taskId}`
    const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString('base64')
    
    const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Basic ${auth}` }
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Summary data:', data.tasks[0].result[0])
    return data.tasks[0].result[0]
}