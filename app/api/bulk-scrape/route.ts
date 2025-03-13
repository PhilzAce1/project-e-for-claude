import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { discoverAndScrapeSitemap } from '@/utils/site-map-helper';

export async function GET(request: Request) {
  try {
    // Parse URL search params
    const url = new URL(request.url);
    const maxPages = parseInt(url.searchParams.get('maxPages') || '100', 10);
    // Add rate limiting parameters with defaults
    const delayBetweenUsers = parseInt(
      url.searchParams.get('delay') || '1000',
      10
    );
    const concurrentLimit = parseInt(
      url.searchParams.get('concurrent') || '1',
      10
    );

    // Validate inputs to prevent server overload
    if (maxPages > 500) {
      return NextResponse.json(
        { error: 'maxPages cannot exceed 500 to prevent server overload' },
        { status: 400 }
      );
    }

    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Fetch all users from the database
    const { data: users, error: usersError } = await supabase
      .from('business_information')
      .select('user_id, domain')
      .not('domain', 'is', null);

    if (usersError) {
      console.error('Database error:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users from database' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in the database' },
        { status: 400 }
      );
    }

    // Extract user IDs from the fetched users
    const userIds = users.map((user) => user.user_id);
    const results = [];

    // Process users in batches to prevent server overload
    for (let i = 0; i < userIds.length; i += concurrentLimit) {
      const batch = userIds.slice(i, i + concurrentLimit);
      const batchPromises = batch.map(async (userId) => {
        try {
          // Get the domain for this user from the initial query
          const userDomain = users.find(
            (user) => user.user_id === userId
          )?.domain;

          if (!userDomain) {
            return {
              userId,
              status: 'skipped',
              message: 'No domain found for user'
            };
          }

          // Process the domain by calling the site-map API
          try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            // Make API call to /site-map endpoint
            const response = await fetch(`${url.origin}/api/site-map`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                domain: userDomain,
                maxPages,
                userId
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `API call failed with status: ${response.status}. Details: ${errorText}`
              );
            }

            const data = await response.json();

            return {
              userId,
              domain: userDomain,
              status: 'success',
              pagesFound: data.pagesFound,
              data: data.scrapedPages
            };
          } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
              return {
                userId,
                domain: userDomain,
                status: 'error',
                message: 'Request timed out after 60 seconds'
              };
            }

            return {
              userId,
              domain: userDomain,
              status: 'error',
              message: error instanceof Error ? error.message : String(error)
            };
          }
        } catch (error: unknown) {
          return {
            userId,
            status: 'error',
            message: error instanceof Error ? error.message : String(error)
          };
        }
      });
      // Wait for all promises in the current batch to resolve
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to prevent server overload
      if (i + concurrentLimit < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenUsers));
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Bulk scrape error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// To call this API route, use the following URL:
// GET https://your-domain.com/api/bulk-scrape
//
// Optional query parameters:
// - maxPages: Maximum number of pages to scrape per domain (default: 100, max: 500)
// - delay: Milliseconds to wait between processing batches (default: 1000)
// - concurrent: Number of users to process concurrently (default: 1)
//
// Example:
// GET https://your-domain.com/api/bulk-scrape?maxPages=200&delay=2000&concurrent=2
