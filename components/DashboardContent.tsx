"use client"

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function DashboardContent({ user, userDetails }: {
    user: User;
    userDetails: any;
}) {
    const [domain, setDomain] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingDomain, setExistingDomain] = useState<string | null>(null)
    const supabase = createClientComponentClient()
    const features = [
        {
          name: 'Automated Keyword Research',
          description:
            "Uncover untapped opportunities with our SERP (Search Engine Results Page) driven keyword analysis. We'll identify high-potential keywords tailored to your business, giving you a head start on your SEO strategy.",
        },
        {
          name: 'Keyword Clustering and Content Outline',
          description:
            "Let our advanced algorithms group your keywords into strategic clusters. We'll provide you with a roadmap for content creation, ensuring every piece serves a purpose in your SEO strategy.",
        },
        {
          name: 'Content Creation and SEO Domination',
          description:
            "Transform your outline into SEO-optimised content that ranks. Our AI assistant will guide you through creating engaging, high-quality content designed to dominate search results.",
        },
      ]

    useEffect(() => {
        checkExistingDomain()
    }, [])

    const checkExistingDomain = async () => {
        try {
            const { data, error } = await supabase
                .from('business_information')
                .select('domain')
                .eq('user_id', user.id)
                .single()

            if (error) throw error

            if (data) {
                setExistingDomain(data.domain)
            }
        } catch (error) {
            console.error('Error checking existing domain:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (existingDomain) {
            setError('You have already submitted a domain.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            console.log('Inserting domain into database...')
            // Insert domain into the database
            const { data, error } = await supabase
                .from('business_information')
                .insert([{ user_id: user.id, domain }])
                .select()

            if (error) throw error

            console.log('Business added:', data)

            console.log('Calling Edge Function...')
            // Call the Edge Function to initiate SEO crawl
            const response = await fetch('/api/init-seo-crawl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ domain, userId: user.id }),
            })

            console.log('Edge Function response:', response)

            if (!response.ok) {
                throw new Error('Failed to initiate SEO crawl')
            }

            const responseData = await response.json()
            console.log('Edge Function response data:', responseData)

            setDomain('')
            setExistingDomain(domain)
        } catch (error) {
            console.error('Error:', error)
            setError('Failed to submit domain or initiate SEO crawl. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <div className='flex flex-row flex-nowrap  gap-8 mb-8'>
                <div className='bg-white p-8 rounded-xl flex-1 flex-grow'>
                    {existingDomain ? (
                        <>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl text-center">
                           We're creating your SEO audit!
                        </h1>
                        <p className="mt-4 text-lg text-green-600 text-center">Your registered domain: {existingDomain}</p>
                        </>
                    ) : (
                        <>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl text-center">
                            Let's get your SEO Audit underway
                        </h1>
                        <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-xl ">
                            <label htmlFor="email" className="mt-6 text-lg leading-8 text-gray-600">
                              Enter your website below and we will give you comprehensive insights into how your SEO is currently performing.
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
                              disabled={isSubmitting || !!existingDomain}
                              className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Submitting...' : 'Start Audit'}
                            </button>
                          </div>
                        </form>
                        </>
                    )}
                </div>
                <div className='bg-white p-8 rounded-xl flex-1 flex-grow'></div>
            </div>
            <div className="bg-white py-16 sm:py-32 rounded-xl">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-base font-semibold leading-7 text-indigo-600">Climb the rankings faster whilst you wait</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        We're on the cusp of revolutionising your SEO strategy
                    </p>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                    Our platform is in its final stages of development. Whilst we put the finishing touches on Espy Go, let's kickstart your SEO journey with a comprehensive, free audit of your website.
                    </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <h2 className="text-center mb-8 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">It's as simple as</h2>
                    <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        {features.map((feature, count) => (
                        <div key={feature.name} className="flex flex-col">
                            <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                            <span aria-hidden="true" className="flex-none bg-indigo-600 w-16 h-16 content-center text-center text-4xl text-white rounded-full">{count + 1}</span>
                            {feature.name}
                            </dt>
                            <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                            <p className="flex-auto">{feature.description}</p>
                            </dd>
                        </div>
                        ))}
                    </dl>
                    </div>
                </div>
            </div>

        </div>
    )
}