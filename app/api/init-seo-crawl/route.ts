import { NextResponse } from 'next/server';
import * as client from 'dataforseo-client';
import { createClient } from '@supabase/supabase-js';

// Create the service role client
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function insertBusinessInformation(userId: string, domain: string, businessId: string) {
  try {
    // First check if a record exists
    const { data: existingRecord, error: fetchError } = await serviceRoleClient
      .from('business_information')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error
      throw fetchError;
    }

    let result;
    if (existingRecord) {
      // Update existing record
      const { data, error } = await serviceRoleClient
        .from('business_information')
        .update({ domain })
        .eq('id', businessId)
        .select();

      if (error) throw error;
      result = data;
      console.log('Business updated:', data);
    } else {
      console.log('Business not found, inserting new record...');
      // Insert new record
      const { data, error } = await serviceRoleClient
        .from('business_information')
        .insert([{ user_id: userId, domain }])
        .select();

      if (error) throw error;
      result = data;
      console.log('Business added:', data);
    }

    console.log('Result:', result);
    // Call get-ranked-keywords endpoint
    fetchRankedKeywords(userId, domain, result[0]?.id);

    return result[0];
  } catch (error) {
    console.error('Error in insertBusinessInformation:', error);
    throw error;
  }
}

async function fetchRankedKeywords(userId: string, domain: string, businessId: string) {
  try {
    // Remove http:// or https:// from the domain
    const cleanDomain = domain.replace(/^https?:\/\//, '');

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/get-ranked-keywords`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, domain: cleanDomain, business_id: businessId }),
    });
    console.log('Ranked keywords fetch triggered for:', cleanDomain);
  } catch (error) {
    console.error('Error triggering ranked keywords fetch:', error);
    // Note: We're not throwing the error here to prevent it from blocking the main flow
  }
}

async function initiateExternalSEOCrawl(domain: string) {
  const username = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  const pingbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/pageforseo/pingback/?id=$id&tag=$tag`;
  // const pingbackUrl = `https://7964-2a0d-3344-11a-7c10-f844-384a-3629-27b6.ngrok-free.app/api/pageforseo/pingback/?id=$id&tag=$tag`

  const authFetch = createAuthenticatedFetch(username ?? '', password ?? '');
  console.log('authFetch:: ', authFetch);
  const onPageApi = new client.OnPageApi('https://api.dataforseo.com', { fetch: authFetch });
  console.log('onPageApi:: ', onPageApi);

  const task = new client.OnPageTaskRequestInfo();
  task.target = `https://${domain}`;
  task.max_crawl_pages = 100;
  task.load_resources = true;
  // task.enable_javascript = true
  task.pingback_url = pingbackUrl;
  task.lighthouse = true; // Enable Lighthouse audit
  task.custom_robots_txt = 'User-agent: Mozilla/5.0 (compatible; RSiteAuditor)\nDisallow:';
  task.robots_txt_merge_mode = 'override';
  task.switch_pool = true;
  // task.crawl_sitemap_only = true
  task.respect_sitemap = true;

  try {
    const response = await onPageApi.taskPost([task]);
    console.log('DataForSEO API response:', response);
    if (response && response.tasks && response.tasks.length > 0) {
      return response.tasks[0];
    } else {
      throw new Error('Invalid response from DataForSEO API');
    }
  } catch (error) {
    console.error('Error calling DataForSEO API:', error);
    throw error;
  }
}

async function initiateLighthouseTask(domain: string) {
  const username = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  const authFetch = createAuthenticatedFetch(username ?? '', password ?? '');
  const onPageApi = new client.OnPageApi('https://api.dataforseo.com', { fetch: authFetch });
  // const pingbackUrl = `https://7964-2a0d-3344-11a-7c10-f844-384a-3629-27b6.ngrok-free.app/api/pageforseo/pingback/?id=$id&tag=$tag`

  const task = new client.OnPageTaskRequestInfo();
  task.url = `https://${domain}`;
  task.for_mobile = true;
  task.tag = 'lighthouse_audit';
  task.pingback_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/pageforseo/pingback/?id=$id&tag=$tag`;

  try {
    const response = await onPageApi.lighthouseTaskPost([task]);
    console.log('Lighthouse task response:', response);
    if (response && response.tasks && Array.isArray(response.tasks) && response.tasks.length > 0) {
      return response?.tasks[0]?.id;
    } else {
      throw new Error('Invalid response from DataForSEO Lighthouse API');
    }
  } catch (error) {
    console.error('Error calling DataForSEO Lighthouse API:', error);
    throw error;
  }
}

async function recordSEOCrawl(
  userId: string,
  domain: string,
  externalJobId: string,
  lighthouseTaskId: string,
  updateOriginal: boolean,
  businessId: string,
) {
  if (updateOriginal) {
    const { data, error } = await serviceRoleClient
      .from('seo_crawls')
      .update({
        external_job_id: externalJobId,
        lighthouse_task_id: lighthouseTaskId,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .eq('domain', domain)
      .select();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await serviceRoleClient
      .from('seo_crawls')
      .insert({
        user_id: userId,
        domain: domain,
        external_job_id: externalJobId,
        lighthouse_task_id: lighthouseTaskId,
        business_id: businessId,
      })
      .select();
    if (error) throw error;
    return data;
  }
}

function createAuthenticatedFetch(username: string, password: string) {
  return (url: RequestInfo, init?: RequestInit): Promise<Response> => {
    const token = btoa(`${username}:${password}`);
    const authHeader = { Authorization: `Basic ${token}` };

    const newInit: RequestInit = {
      ...init,
      headers: {
        ...init?.headers,
        ...authHeader,
      },
    };

    return fetch(url, newInit);
  };
}

export async function POST(request: Request) {
  try {
    const { domain, userId, createBusiness = true, businessId } = await request.json();
    let businessData;
    console.log('Inserting domain into database...', createBusiness, businessId);
    if (createBusiness) {
      businessData = await insertBusinessInformation(userId, domain, businessId);
      console.log('Business data:', businessData);
    } else {
      const { data, error } = await serviceRoleClient
        .from('seo_crawls')
        .update({
          lighthouse_data: null,
          scraped_pages: null,
        })
        .eq('business_id', businessId)
        .eq('domain', domain)
        .select();
    }

    console.log(`Initiating SEO crawl for domain: ${domain}, userId: ${userId}`);
    const externalApiData = await initiateExternalSEOCrawl(domain);
    console.log('External API response:', externalApiData);

    if (!externalApiData?.id) {
      throw new Error('External API did not return a valid job ID');
    }

    // Initiate Lighthouse task
    const lighthouseTaskId = await initiateLighthouseTask(domain);

    if (!lighthouseTaskId) {
      throw new Error('Failed to initiate Lighthouse task');
    }

    const crawlData = await recordSEOCrawl(
      userId,
      domain,
      externalApiData.id,
      lighthouseTaskId,
      !createBusiness,
      businessData?.id,
    );

    return NextResponse.json(
      {
        message: 'SEO crawl and Lighthouse audit initiated successfully',
        data: { ...crawlData, businessId: businessData?.id },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
