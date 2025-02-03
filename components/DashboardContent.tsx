"use client"

import { User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import ZeroStateHero from '@/components/ZeroStateHero';
import { SEOOverview } from './ui/SEOOverview';

export default function DashboardContent({ user, keywordRankings }: {
    user: User;
    keywordRankings: any;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient()
    const [keywordSuggestions, setKeywordSuggestions] = useState<any>(null);
    
    const [domain, setDomain] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [existingDomain, setExistingDomain] = useState<string | null>(null)
    const [seoAudit, setSeoAudit] = useState<any>(null)
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
    const [hasCompetitors, setHasCompetitors] = useState<boolean>(false);
    const [hasCriticalInfo, setHasCriticalInfo] = useState(false);
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
    useEffect(() => {
        async function fetchSEOAudit() {
          try {
            const { data: seoData, error } = await supabase
              .from('seo_crawls')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
    
            if (error) throw error
    
            setSeoAudit(seoData)
          } catch (error) {
            console.error('Error fetching SEO audit:', error)
          } finally {
            // setLoading(false)
          }
        }
    
        fetchSEOAudit()
      }, [supabase])
    

    useEffect(() => {
        const checkWelcomeStatus = async () => {
            // Check localStorage first
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (hasSeenWelcome) {
                return;
            }

            if (error) {
                console.error('Error fetching welcome status:', error);
                return;
            }

            if (!hasSeenWelcome) {
                if (user.created_at) {
                    const createdAt = new Date(user.created_at);
                    const now = new Date();
                    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
                    
                    if (createdAt > twoMinutesAgo && pathname !== '/welcome') {
                        window.location.href = '/welcome';
                    }
                }
            } else {
                // If user has seen welcome in database, update localStorage
                localStorage.setItem('hasSeenWelcome', 'true');
            }
        };

        checkWelcomeStatus();
    }, [user.id, user.created_at, router, pathname, supabase]);

    useEffect(() => {
        setIsWelcomeModalOpen(pathname === '/welcome');
    }, [pathname]);

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
        checkExistingDomain();
    }, [checkExistingDomain]);

    const closeWelcomeModal = async () => {
        setIsWelcomeModalOpen(false);
        
        // Update localStorage
        localStorage.setItem('hasSeenWelcome', 'true');

        // Update database
        const { error } = await supabase
            .from('users')
            .update({ has_seen_welcome: true })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating welcome status:', error);
        }

        router.push('/');
    };

    useEffect(() => {
        const updateUserMetadata = async () => {
            if (typeof window === "undefined" || !window.tolt_referral) {
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .upsert({ 
                        user_id: user.id,
                        referral_code: window.tolt_referral
                    }, { 
                        onConflict: 'user_id'
                    })
                    .select()

                if (error) throw error

            } catch (error) {
                console.error('Error updating user referral data:', error)
            }
        }

        updateUserMetadata()
    }, [supabase, user.id]) // Only run once when component mounts

    useEffect(() => {
        const checkProfileCompletion = async () => {
            try {
                // Get latest business analysis
                const { data: analysis, error: analysisError } = await supabase
                    .from('business_analyses')
                    .select('completion_status')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (analysisError) throw analysisError;

                // Check if all sections are complete
                const allSectionsComplete = analysis?.completion_status && 
                    analysis.completion_status.verification === true &&
                    analysis.completion_status.critical === true &&
                    analysis.completion_status.recommended === true;

                setHasCriticalInfo(!allSectionsComplete);

                // Check competitors
                const { data: competitors, error: competitorsError } = await supabase
                    .from('competitors')
                    .select('domain')
                    .eq('user_id', user.id);

                if (competitorsError) throw competitorsError;
                setHasCompetitors(competitors && competitors.length > 0);

            } catch (error) {
                console.error('Error checking profile completion:', error);
            }
        };

        checkProfileCompletion();
    }, [supabase, user.id]);

    if (!existingDomain && !domain) {
        return (
            <ZeroStateHero 
                title="Kickstart Your SEO Strategy Now!"
                subtitle="We need to start by learning about your business."
                description="Enter your domain below to begin."
                ctaText="Start Now"
                user={user}
                imageSrc="/rank-image.webp"
                fullPage={true}
                domainHandler={setDomain}
            />
        );
    }

    return (
        <>
            <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
                <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    {(hasCriticalInfo || !hasCompetitors) ? 'Complete your profile' : 'Dashboard'}
                </h1>
            </div>
            {(hasCriticalInfo || !hasCompetitors) ? (
            <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
                {hasCriticalInfo && (
                    <li className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
                        <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Confirm your business information
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-300">
                            To create a personalised SEO strategy, we need to know a more about your business.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/business-information"
                                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Complete Information
                            </Link>
                        </div>
                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
                        >
                            <circle r={512} cx={512} cy={512} fill="url(#827591b1-ce8c-4110-b064-fff)" fillOpacity="0.7" />
                            <defs>
                            <radialGradient id="827591b1-ce8c-4110-b064-fff">
                                <stop stopColor="#7775D6" />
                                <stop offset={1} stopColor="#DDEECF" />
                            </radialGradient>
                            </defs>
                        </svg>
                    </li>
                )}

                {!hasCompetitors && (
                    <li className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16">
                        <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Who are your competitors?
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-300">
                            Let's find out who your competitors are, and how you can outrank them.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/competitors"
                                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                Enter competitors
                            </Link>
                        </div>
                        <svg
                            viewBox="0 0 1024 1024"
                            aria-hidden="true"
                            className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
                        >
                            <circle r={512} cx={512} cy={512} fill="url(#827591b1-ce8c-4110-b064-7cb85a0b1217)" fillOpacity="0.7" />
                            <defs>
                            <radialGradient id="827591b1-ce8c-4110-b064-7cb85a0b1217">
                                <stop stopColor="#7775D6" />
                                <stop offset={1} stopColor="#5745C2" />
                            </radialGradient>
                            </defs>
                        </svg>
                    </li>
                )}
            </ul>
            ) : (
                <SEOOverview
                    keywordRankings={keywordRankings}
                    seoAudit={seoAudit}
                    user={user}
                    keywordSuggestions={keywordSuggestions}
                 />
            )}
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

// Add this type declaration at the end of the file
declare global {
    interface Window {
        tolt_referral?: any;
    }
}