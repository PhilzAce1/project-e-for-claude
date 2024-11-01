import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';

interface ZeroStateHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  imageSrc: string;
  imageAlt?: string;
  user: User;
  fullPage?: boolean;
  domainHandler: (domain: string) => void;
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setIsSubmitting(true)
        setError(null)
        domainHandler(domain)
        // try {
        //     const response = await fetch('/api/init-seo-crawl', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ domain, userId: user.id }),
        //     })

        //     if (!response.ok) {
        //         throw new Error('Failed to submit domain')
        //     }

        //     await response.json()

        //     setDomain('')
        // } catch (error) {
        //     console.error('Error:', error)
        //     setError('Failed to submit domain. Please try again.')
        // } finally {
        //     setIsSubmitting(false)
        // }
    }

  return (
    <div className=' bg-white relative p-8 rounded-xl overflow-hidden h-full sm:shadow ring-slate-900/10'>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-2 lg:px-8">
        <div className={`mx-auto max-w-2xl py-24 lg:max-w-none lg:py-64`}>
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
      <div className={`h-48 w-full sm:h-64 lg:absolute lg:right-0 lg:top-0 lg:h-full lg:w-1/2 `}>
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
