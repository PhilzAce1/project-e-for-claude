'use client';

import { PostHogProvider } from 'posthog-js/react'
import { ReactNode, useEffect } from 'react'
import posthog from 'posthog-js'
import { usePathname } from 'next/navigation'

export default function PHProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'default_key', {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug()
        }
      })
    }
  }, [])

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview')
    }
  }, [pathname])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
