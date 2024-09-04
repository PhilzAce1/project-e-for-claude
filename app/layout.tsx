import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  return (
    <html lang="en">
      <body className="bg-gray-50">
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
