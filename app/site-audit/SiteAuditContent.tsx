"use client"

import { User } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Spinner from '@/components/ui/Spinner';
import LighthouseAudits from '@/components/ui/LighthouseAudits';
import { siteAuditDictionary, siteAutitPriority } from '@/utils/helpers/site-audit-dictionary';
import ZeroStateHero from '@/components/ZeroStateHero';

// Define the type for your audit items
type Audit = {
  // Add the properties of your audit object here
  id: number;
  domain: string;
  // ... other properties
};

export default function SiteAuditContent({ user, seoCrawlData }: {
    user: User | null;
    seoCrawlData: any;
}) {
    if (!user) {
        return <div>Please sign in to view your site audit.</div>;
    }

    console.log(seoCrawlData)

    if (!seoCrawlData) {
        return (
            
            <ZeroStateHero 
                title="Kickstart Your SEO Strategy Now!"
                subtitle="We need to start by learning about your business."
                description="Enter your domain below to begin."
                ctaText="Start Now"
                user={user}
                imageSrc="/rank-image.webp"
                fullPage={true}
            />
        );
    }

    const { onpage_score, lighthouse_data, page_metrics } = seoCrawlData;

    if (!onpage_score || !lighthouse_data) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Spinner />
                <p className="mt-4 text-gray-600">We're still working on your site audit. We'll email you when it's ready.</p>
            </div>
        );
    }

    const { categories } = lighthouse_data;
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Performance');
    const supabase = createClientComponentClient();
    const lighthouseStats = [
        { id: 1, name: 'Performance', value: categories.performance.score * 100 },
        { id: 2, name: 'Accessibility', value: categories.accessibility.score * 100 },
        { id: 3, name: 'Best Practices', value: categories['best-practices'].score * 100 },
        { id: 4, name: 'SEO', value: categories.seo.score * 100},
    ]

    console.log(onpage_score, seoCrawlData)

    const [audits, setAudits] = useState<Audit[]>([]);

    useEffect(() => {
        async function fetchAudits() {
            try {
                const { data, error } = await supabase
                    .from('seo_crawls')
                    .select('*')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAudits(data as Audit[] || []);
            } catch (error) {
                console.error('Error fetching audits:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchAudits();
    }, []);

    function getScoreColor(score: number): string {
        if (score >= 86) return 'text-green-500';
        if (score >= 50) return 'text-amber-500';
        return 'text-red-500';
    }

    function getScoreBGColor(score: number): string {
        if (score >= 86) return 'bg-green-50';
        if (score >= 50) return 'bg-amber-50';
        return 'bg-red-50';
    }

    function getActiveScoreColor(score: number): string {
        if (score >= 86) return 'bg-green-500 text-white';
        if (score >= 50) return 'bg-amber-500 text-white';
        return 'bg-red-500 text-white';
    }

    function renderTabContent(tabName: string) {
        switch (tabName) {
            case 'Performance':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">Performance</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                        <LighthouseAudits 
                            lighthouseData={lighthouse_data} 
                            category="performance" // or "accessibility", "best-practices", "seo", etc.
                        />
                    </>)
            case 'Accessibility':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">Accessibility</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>                        
                    <LighthouseAudits 
                            lighthouseData={lighthouse_data} 
                            category="accessibility" // or "accessibility", "best-practices", "seo", etc.
                        />
                    </>)
            case 'Best Practices':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">Best Practices</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>                        <LighthouseAudits 
                            lighthouseData={lighthouse_data} 
                            category="best-practices" // or "accessibility", "best-practices", "seo", etc.
                        />
                    </>)
            case 'SEO':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">SEO</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                    <LighthouseAudits 
                            lighthouseData={lighthouse_data} 
                            category="seo" // or "accessibility", "best-practices", "seo", etc.
                        />
                    </>)
            default:
                return <p>Select a category to see detailed information.</p>
        }
    }

    // Create a map of priorities for quick lookup
    const priorityMap = new Map(siteAutitPriority.map((item, index) => [item.key, index]));

    // Add this array of checks to exclude
    const excludedChecks = ['is_https', 'has_meta_viewport', 'canonical', 'is_www', 'is_redirect'];

    // Modify the filteredChecks definition
    const filteredChecks = Object.entries(page_metrics?.checks || {} as Record<string, number>)
        .filter(([key, value]: [string, unknown]) => typeof value === 'number' && value > 0 && !excludedChecks.includes(key))
        .sort(([keyA, valueA], [keyB, valueB]) => {
            // First, sort by priority
            const priorityA = priorityMap.get(keyA) ?? Infinity;
            const priorityB = priorityMap.get(keyB) ?? Infinity;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            // If priority is the same, sort by number of affected pages
            return (valueB as number) - (valueA as number);
        });
        
    const totalIssues = filteredChecks.reduce((sum, [_, value]) => sum + (value as number), 0);

    return (
        <div className="container mx-auto">
            <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
                <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Site Audit: <a href={seoCrawlData?.domain} className='text-orange-600 hover:text-orange-500'>{seoCrawlData?.domain}</a></h1>
            </div>
            <dl className="mt-8 flex overflow-hidden  bg-white divide-x items-center rounded-2xl text-center ring-slate-900/10 ring-1">
                  <div className=" p-8 flex-grow">
                  <dd className={`order-first p-8 text-6xl inline-block font-semibold tracking-tight rounded-xl mb-4 ${getScoreBGColor(parseInt(onpage_score))} ${getScoreColor(parseInt(onpage_score))}`}>{parseInt(onpage_score) }</dd>
                    <dt className="font-serif text-sm font-semibold  leading-6 text-gray-600 ">On Page SEO Score</dt>
                  </div>
                  <div className='h-96 overflow-auto flex-grow-0 relative'>
                    <img src={seoCrawlData.lighthouse_data.fullPageScreenshot.screenshot.data} />
                  </div>
            </dl>
            <div className="mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl  ring-slate-900/10 ring-1 sm:grid-cols-2 lg:grid-cols-2 ">
                  <div className="flex flex-col bg-white p-8 relative pb-20">
                    
                    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">Pages Discovered</h2>
                    </div>
                    <p className="mt-4 text-3xl font-bold">{seoCrawlData?.total_pages || 'N/A'}</p>
                    <p className="mt-2 text-sm text-gray-500">We've crawled {seoCrawlData?.total_pages || 'N/A'} pages and found {page_metrics?.non_indexable || 0} non-indexable pages for a total of {seoCrawlData?.total_pages || 'N/A'} pages discovered.</p>
                    
                    <div className="border-b mt-8 border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h3 className=" text-base font-semibold leading-6 text-gray-900">Page Status</h3>
                    </div>
                    <ul className='mt-4'>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-green-500 rounded-full inline-block'></span>
                            Successful: <strong>{seoCrawlData?.total_pages - (page_metrics?.checks?.is_broken || 0) - (page_metrics?.checks?.is_4xx_code || 0) - (page_metrics?.checks?.is_5xx_code || 0) - (page_metrics?.checks?.is_redirect || 0) || 'N/A'}</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-teal-500 rounded-full inline-block'></span>
                            Redirects: <strong>{page_metrics?.is_redirect || 0}</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-orange-500 rounded-full inline-block'></span>
                            Broken: <strong>{(page_metrics?.checks?.is_broken || 0) + (page_metrics?.checks?.is_4xx_code || 0) + (page_metrics?.checks?.is_5xx_code || 0)}</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-red-500 rounded-full inline-block'></span>
                            Blocked: <strong>{page_metrics?.non_indexable || 0}</strong>
                        </li>
                    </ul>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 border-t text-sm">
                        <a href="/site-audit/pages" className="font-medium text-orange-600 hover:text-orange-500 p-4 my-4 ">
                            View All Pages
                        </a>
                    </div>
                  </div>
                  <div className="flex flex-col bg-white p-8 relative pb-20">
                    
                    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">                        
                        <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">SEO Issues Discovered</h2>
                    </div>
                    <p className="mt-4 text-3xl font-bold">
                        {totalIssues}
                    </p>
                    
                    <div className="border-b border-gray-200 mt-8 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Top SEO Issues</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                    {filteredChecks.slice(0, 4).map(([key, value]) => (
                        <li key={key} className='whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0'>
                            <a href={`/site-audit/issues/${key}`}  className='text-orange-600 hover:text-orange-500'>
                                {String(value)} pages
                            </a>
                            {' '}
                            {siteAuditDictionary[key as keyof typeof siteAuditDictionary] || `have an issue with ${key}`}
                            <a href={`/site-audit/issues/${key}`}  className='text-orange-600 hover:text-orange-500 float-right'>View Details</a>
                        </li>
                    ))}
                    </ul>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 border-t text-sm">
                        <a href="/site-audit/issues" className="font-medium text-orange-600 hover:text-orange-500">
                            View All Issues
                        </a>
                    </div>
                  </div>
            </div>
            <div className="bg-white mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl  ring-slate-900/10 ring-1 p-8">
                <h2 className="font-serif text-xl font-bold leading-6 text-gray-900">Site Speed - Powered by Google Lighthouse</h2>                   
            </div>
            {loading ? (
                <p>Loading audits...</p>
            ) : lighthouseStats.length > 0 ? (
                <>
                    <dl className="mt-8 border-b border-gray-200 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl rounded-b-none text-center sm:grid-cols-2 lg:grid-cols-4 ring-slate-900/10 ring-1">
                        {lighthouseStats.map((stat) => (
                            <div 
                                key={stat.id} 
                                className={`flex flex-col bg-white p-8 cursor-pointer`}
                                onClick={() => setActiveTab(stat.name)}
                            >
                                <dt className="text-sm font-semibold leading-6 text-gray-600">{stat.name}</dt>
                                <dd className={`rounded-lg p-4 order-first text-3xl font-semibold tracking-tight 
                                    ${activeTab === stat.name 
                                        ? getActiveScoreColor(parseInt(stat.value.toString()))
                                        : `${getScoreBGColor(parseInt(stat.value.toString()))} ${getScoreColor(parseInt(stat.value.toString()))}`
                                    }`}
                                >
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div className='bg-white grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl rounded-t-none ring-slate-900/10 ring-1 p-8'>
                        {renderTabContent(activeTab)}
                    </div>
                </>
            ) : (
                <p>No audits found. Start a new audit from the dashboard.</p>
            )}
        </div>
    );
}
