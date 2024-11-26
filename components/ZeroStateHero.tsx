'use client'
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface ZeroStateHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  imageSrc: string;
  imageAlt?: string;
  user: User;
  fullPage?: boolean;
  domainHandler?: (domain: string) => void;
}

const ZeroStateHero: React.FC<ZeroStateHeroProps> = ({
  title,
  subtitle,
  description,
  ctaText,
  user,
  imageSrc,
  imageAlt,
  domainHandler,
}) => {
    const [domain, setDomain] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            // Clean up the domain - remove protocol, www, and trailing slashes
            const cleanDomain = domain
                .replace(/^(https?:\/\/)?(www\.)?/i, '') // Remove protocol and www
                .replace(/\/.*$/, '') // Remove everything after the first slash
                .trim(); // Remove any whitespace

            // Validate domain format before submitting
            const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
            if (!domainRegex.test(cleanDomain)) {
                throw new Error('Please enter a valid domain (e.g., example.com)');
            }

            // Call both APIs in parallel
            const [seoCrawlResponse, businessAnalysisResponse] = await Promise.all([
                fetch('/api/init-seo-crawl', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ domain: cleanDomain, userId: user.id }),
                }),
                fetch('/api/extract-business-information', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ domain: cleanDomain }),
                })
            ]);

            // Handle responses...
            if (!seoCrawlResponse.ok) {
                const seoCrawlData = await seoCrawlResponse.json();
                throw new Error(seoCrawlData.error || 'Failed to submit domain for SEO crawl');
            }

            if (!businessAnalysisResponse.ok) {
                const businessData = await businessAnalysisResponse.json();
                throw new Error(businessData.error || 'Failed to start business analysis');
            }

            const businessData = await businessAnalysisResponse.json();

            // Call the domain handler for any additional processing
            if (domainHandler) {
                domainHandler(cleanDomain);
            }

            // Reset form
            setDomain('');

            // Redirect to business information page
            router.push(`/business-information?id=${businessData.data.analysisId}`);

        } catch (error: any) {
            console.error('Error:', error);
            setError(error.message || 'Failed to submit domain. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <div className=' bg-white relative lg:p-8 rounded-xl overflow-hidden h-full sm:shadow ring-slate-900/10  flex flex-col items-stretch'>
      <div className="mx-auto max-w-7xl px-8 lg:grid lg:grid-cols-2 lg:px-8">
        <div className={`mx-auto max-w-2xl sm:p-16 lg:px-0 py-8 lg:max-w-none lg:py-64`}>
          <div className="lg:pr-16">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl xl:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 text-xl text-gray-600">
                {subtitle}
              </p>
            )}
            <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl ">
                <label htmlFor="email" className="mt-6 text-lg leading-8 text-gray-600">
                  {description}
                </label>
                <div className="mt-2.5">
                  <input
                    id="domain"
                    name="domain"
                    type="url"
                    placeholder='e.g. https://espy-go.com'
                    autoComplete="url"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                    className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="block rounded-md border border-transparent bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700"
                >
                  {isSubmitting ? 'Submitting...' :  ctaText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className={`h-full w-full lg:absolute lg:right-0 lg:top-0  lg:w-1/2 `}>
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
};

export default ZeroStateHero;
