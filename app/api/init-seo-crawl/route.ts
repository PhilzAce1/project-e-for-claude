import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as client from 'dataforseo-client'
import { createClient } from '@supabase/supabase-js'

// Create the service role client
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function insertBusinessInformation(userId: string, domain: string) {
    const { data, error } = await serviceRoleClient
        .from('business_information')
        .insert([{ user_id: userId, domain }])
        .select()

    if (error) throw error
    console.log('Business added:', data)
    return data
}

async function initiateExternalSEOCrawl(domain: string) {
    const username = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    const pingbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/pageforseo/pingback/`
    // const pingbackUrl = `https://7964-2a0d-3344-11a-7c10-f844-384a-3629-27b6.ngrok-free.app/api/pageforseo/pingback/?id=$id&tag=$tag`
    

    const authFetch = createAuthenticatedFetch(username ?? '', password ?? '')
    const onPageApi = new client.OnPageApi("https://api.dataforseo.com", { fetch: authFetch })

    const task = new client.OnPageTaskRequestInfo()
    task.target = domain
    // task.max_crawl_pages = 10
    task.load_resources = true
    task.enable_javascript = true
    task.pingback_url = pingbackUrl
    task.lighthouse = true // Enable Lighthouse audit

    const response = await onPageApi.taskPost([task])
    const taskId = response?.tasks?.[0]?.id

    try {
        const response = await onPageApi.taskPost([task])
        console.log('DataForSEO API response:', response)
        if (response && response.tasks && response.tasks.length > 0) {
            return response.tasks[0]
        } else {
            throw new Error('Invalid response from DataForSEO API')
        }
    } catch (error) {
        console.error('Error calling DataForSEO API:', error)
        throw error
    }
}

async function initiateLighthouseTask(domain: string) {
    const username = process.env.DATAFORSEO_LOGIN
    const password = process.env.DATAFORSEO_PASSWORD
    const authFetch = createAuthenticatedFetch(username ?? '', password ?? '')
    const onPageApi = new client.OnPageApi("https://api.dataforseo.com", { fetch: authFetch })
    // const pingbackUrl = `https://7964-2a0d-3344-11a-7c10-f844-384a-3629-27b6.ngrok-free.app/api/pageforseo/pingback/?id=$id&tag=$tag`

    const task = new client.OnPageTaskRequestInfo()
    task.url = domain
    task.for_mobile = true
    task.tag = "lighthouse_audit"
    task.pingback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/dataforseo/pingback/?id=$id&tag=$tag`

    try {
        const response = await onPageApi.lighthouseTaskPost([task])
        console.log('Lighthouse task response:', response)
        if (response && response.tasks && Array.isArray(response.tasks) && response.tasks.length > 0) {
            return response?.tasks[0]?.id
        } else {
            throw new Error('Invalid response from DataForSEO Lighthouse API')
        }
    } catch (error) {
        console.error('Error calling DataForSEO Lighthouse API:', error)
        throw error
    }
}

async function recordSEOCrawl(userId: string, domain: string, externalJobId: string, lighthouseTaskId: string) {
    const { data, error } = await serviceRoleClient
        .from('seo_crawls')
        .insert({ 
            user_id: userId, 
            domain: domain, 
            external_job_id: externalJobId,
            lighthouse_task_id: lighthouseTaskId
        })
        .select()

    if (error) throw error
    return data
}

function createAuthenticatedFetch(username: string, password: string) {
    return (url: RequestInfo, init?: RequestInit): Promise<Response> => {
        const token = btoa(`${username}:${password}`)
        const authHeader = { 'Authorization': `Basic ${token}` }

        const newInit: RequestInit = {
            ...init,
            headers: {
                ...init?.headers,
                ...authHeader
            }
        }

        return fetch(url, newInit)
    }
}

export async function POST(request: Request) {
    try {
        const { domain, userId } = await request.json()
        
        console.log('Inserting domain into database...')
        await insertBusinessInformation(userId, domain)

        console.log(`Initiating SEO crawl for domain: ${domain}, userId: ${userId}`)
        const externalApiData = await initiateExternalSEOCrawl(domain)
        console.log('External API response:', externalApiData)

        if (!externalApiData?.id) {
            throw new Error('External API did not return a valid job ID')
        }

        // Initiate Lighthouse task
        const lighthouseTaskId = await initiateLighthouseTask(domain)

        if (!lighthouseTaskId) {
            throw new Error('Failed to initiate Lighthouse task')
        }

        const crawlData = await recordSEOCrawl(userId, domain, externalApiData.id, lighthouseTaskId)

        return NextResponse.json({ 
            message: 'SEO crawl and Lighthouse audit initiated successfully', 
            data: crawlData
        }, { status: 200 })
    } catch (error) {
        console.error('Error in API route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

