"use client"

import { User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import ZeroStateHero from '@/components/ZeroStateHero';

export default function DashboardContent({ user, isSeoCrawlComplete }: {
    user: User;
    isSeoCrawlComplete: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClientComponentClient()
    
    const [domain, setDomain] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingDomain, setExistingDomain] = useState<string | null>(null)
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)

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

                console.log('User referral data updated successfully')
            } catch (error) {
                console.error('Error updating user referral data:', error)
            }
        }

        updateUserMetadata()
    }, [supabase, user.id]) // Only run once when component mounts

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
            <h1>We've input a domain for you! {domain}</h1>

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