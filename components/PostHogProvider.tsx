'use client';

import { PostHogProvider } from 'posthog-js/react'
import { ReactNode } from 'react'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'default_key', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug()
    }
  })
}

export default function PHProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => posthog?.capture('$pageview')
    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
