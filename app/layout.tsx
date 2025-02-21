import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleTagManager, GoogleTagManagerNoScript } from '../components/GoogleTagManager';
import posthog from 'posthog-js'


import 'styles/main.css';

const title = 'Espy Go - Your SEO Professional';
const description = 'Brought to you by Elysium Studios';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description
  }
};

export default async function RootLayout({ children }: PropsWithChildren) {
  posthog.init('phc_eo79hckGlZY0wY0WL7cpVHxPkpWdEhwUvKJzKcwowen',
      {
          api_host: 'https://eu.i.posthog.com',
          person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
      }
  )
  return (
    <html lang="en">
      <head>
        <GoogleTagManager gtmId="GTM-NJXB6P95" />
        <script async src="https://cdn.tolt.io/tolt.js" data-tolt="6dc3be35-e666-4227-82f0-42713dfa3e77"></script>
        {/* Other head elements */}
      </head>
      <body className="bg-gray-50">
        <GoogleTagManagerNoScript gtmId="GTM-NJXB6P95" />
        <main
          id="skip"
          className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
        >
          {children}
        </main>
        <Suspense>
          <Toaster />
        </Suspense>
        <SpeedInsights/>
      </body>
    </html>
  );
}
