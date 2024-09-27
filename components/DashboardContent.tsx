"use client"

import { User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export default function DashboardContent({ user, userDetails, isSeoCrawlComplete }: {
    user: User;
    userDetails: any;
    isSeoCrawlComplete: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    
    const [domain, setDomain] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingDomain, setExistingDomain] = useState<string | null>(null)
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
    const supabase = createClientComponentClient()

    const features = [
        {
          name: 'Automated Keyword Research',
          description: "Uncover untapped opportunities with our SERP (Search Engine Results Page) driven keyword analysis. We'll identify high-potential keywords tailored to your business, giving you a head start on your SEO strategy.",
        },
        {
          name: 'Keyword Clustering and Content Outline',
          description: "Let our advanced algorithms group your keywords into strategic clusters. We'll provide you with a roadmap for content creation, ensuring every piece serves a purpose in your SEO strategy.",
        },
        {
          name: 'Content Creation and SEO Domination',
          description: "Transform your outline into SEO-optimised content that ranks. Our AI assistant will guide you through creating engaging, high-quality content designed to dominate search results.",
        },
    ]

    const checkNewUser = useCallback(() => {
        if (user.created_at) {
            const createdAt = new Date(user.created_at);
            const now = new Date();
            const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
            
            if (createdAt > twoMinutesAgo && pathname !== '/welcome') {
                router.push('/welcome');
            }
        }
    }, [user.created_at, router, pathname]);

    const checkExistingDomain = useCallback(async () => {
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
    }, [supabase, user.id]);

    useEffect(() => {
        checkNewUser();
        checkExistingDomain();
    }, [checkNewUser, checkExistingDomain]);

    useEffect(() => {
        setIsWelcomeModalOpen(pathname === '/welcome');
    }, [pathname]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (existingDomain) {
            setError('You have already submitted a domain.')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch('/api/init-seo-crawl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ domain, userId: user.id }),
            })

            if (!response.ok) {
                throw new Error('Failed to initiate SEO crawl')
            }

            await response.json()

            setDomain('')
            setExistingDomain(domain)
        } catch (error) {
            console.error('Error:', error)
            setError('Failed to submit domain or initiate SEO crawl. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const closeWelcomeModal = () => {
        setIsWelcomeModalOpen(false);
        router.push('/');
    };

    return (
        <>
            <div>
                <div className='flex flex-col sm:flex-col xl:flex-row  gap-8 mb-8'>
                    <div className='bg-white p-8 rounded-xl flex-1 flex-grow'>
                        {existingDomain ? (
                            <>
                            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-2xl text-center">
                               We're creating your SEO audit!
                            </h1>
                            <p className='mt-4 text-lg text-center'>We will drop you an email as soon as it's ready</p>
                            <p className="mt-4 text-lg text-green-600 text-center">Your registered domain: {existingDomain}</p>

                        {isSeoCrawlComplete && (
                            <p className='text-center mt-4'>
                                <Link href="/site-audit" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                                        Review Your Audit
                                </Link>
                            </p>
                        )}
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
                                  className="block w-full rounded-md bg-orange-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                                >
                                  {isSubmitting ? 'Submitting...' : 'Start Audit'}
                                </button>
                              </div>
                            </form>
                            </>
                        )}
                    </div>
                    <div className='bg-white p-8 rounded-xl flex-1 flex-grow content-center'>
                        <div className='aspect-w-16 aspect-h-9'>
                            <iframe width="560" height="315" src="https://www.youtube.com/embed/ZtpiYRahKAg?si=uyR_mHJgyQQTYoQT" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
                        </div>
                    </div>
                </div>
                <div className="bg-white py-16 sm:py-32 rounded-xl">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-orange-600">Climb the rankings faster whilst you wait</h2>
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
                                <span aria-hidden="true" className="flex-none bg-orange-600 w-16 h-16 content-center text-center text-4xl text-white rounded-full">{count + 1}</span>
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

            <Transition appear show={isWelcomeModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeWelcomeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Welcome to Espy Go!
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            We're excited to have you on board. Let's get started with your SEO journey!
                                        </p>
                                    </div>

                                    <div className="mt-4 text-center">
                                        <button
                                            type="button"
                                            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                                            onClick={closeWelcomeModal}
                                        >
                                            Get Started
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}