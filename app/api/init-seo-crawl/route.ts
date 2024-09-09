import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import * as client from 'dataforseo-client'

const supabase = createRouteHandlerClient({ cookies })

async function insertBusinessInformation(userId: string, domain: string) {
    const { data, error } = await supabase
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

    const authFetch = createAuthenticatedFetch(username, password)
    const onPageApi = new client.OnPageApi("https://api.dataforseo.com", { fetch: authFetch })

    const task = new client.OnPageTaskRequestInfo()
    task.target = domain
    task.max_crawl_pages = 10
    task.load_resources = true
    task.enable_javascript = true
    task.pingback_url = pingbackUrl  // Add the pingback URL here

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

async function recordSEOCrawl(userId: string, domain: string, externalJobId: string) {
    const { data, error } = await supabase
        .from('seo_crawls')
        .insert({ user_id: userId, domain: domain, external_job_id: externalJobId })
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

        const crawlData = await recordSEOCrawl(userId, domain, externalApiData?.id)

        return NextResponse.json({ message: 'SEO crawl initiated successfully', data: crawlData }, { status: 200 })
    } catch (error) {
        console.error('Error in API route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

