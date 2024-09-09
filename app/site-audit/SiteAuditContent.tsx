"use client"

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function SiteAuditContent({ user, userDetails }: {
    user: User;
    userDetails: any;
}) {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Performance');
    const supabase = createClientComponentClient();
    const stats = [
        { id: 1, name: 'On Page SEO Score', value: '99' },
        { id: 2, name: 'Organic Monthly Traffic', value: '1250' },
        { id: 3, name: 'Organic Keywords', value: '35' },
        { id: 4, name: 'Backlinks', value: '66' },
    ]
    const lighthouseStats = [
        { id: 1, name: 'Performance', value: '62' },
        { id: 2, name: 'Accessibility', value: '90' },
        { id: 3, name: 'Best Practices', value: '100' },
        { id: 4, name: 'SEO', value: '85' },
    ]

    useEffect(() => {
        fetchAudits();
    }, []);

    async function fetchAudits() {
        try {
            const { data, error } = await supabase
                .from('seo_crawls')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAudits(data || []);
        } catch (error) {
            console.error('Error fetching audits:', error);
        } finally {
            setLoading(false);
        }
    }

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
                        <h2 className="text-xl font-bold leading-6 text-gray-900">Performance</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> without a H1 heading
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> with broken links
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>26 pages</a> with no meta description
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                    </ul>
                    </>)
            case 'Accessibility':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="text-xl font-bold leading-6 text-gray-900">Accessibility</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> without a H1 heading
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> with broken links
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>26 pages</a> with no meta description
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                    </ul>
                    </>)
            case 'Best Practices':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="text-xl font-bold leading-6 text-gray-900">Best Practices</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> without a H1 heading
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> with broken links
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>26 pages</a> with no meta description
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                    </ul>
                    </>)
            case 'SEO':
                return (
                    <>
                    <div className="border-b border-gray-200 pb-5">
                        <h2 className="text-xl font-bold leading-6 text-gray-900">SEO</h2>
                        <h3 className="text-l leading-6 text-gray-900">Improvements required (In priority order)</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> without a H1 heading
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> with broken links
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>26 pages</a> with no meta description
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                    </ul>
                    </>)
            default:
                return <p>Select a category to see detailed information.</p>
        }
    }

    return (
        <div className="container mx-auto">
            <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Site Audit: <a href={audits[0]?.domain} className='text-indigo-600 hover:text-indigo-500'>{audits[0]?.domain}</a></h1>
            </div>
            {loading ? (
                <p>Loading audits...</p>
            ) : audits.length > 0 ? (
            <dl className="mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4 ring-slate-900/10 ring-1">
                {stats.map((stat) => (
                  <div key={stat.id} className="flex flex-col bg-white p-8">
                    <dt className="text-sm font-semibold leading-6 text-gray-600 ">{stat.name}</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
                <p>No audits found. Start a new audit from the dashboard.</p>
            )}
            <div className="mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl  ring-slate-900/10 ring-1 sm:grid-cols-2 lg:grid-cols-2 ">
                  <div className="flex flex-col bg-white p-8 relative pb-20">
                    
                    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h2 className="text-xl font-bold leading-6 text-gray-900">Pages Discovered</h2>
                    </div>
                    <p className="mt-4 text-3xl font-bold">61</p>
                    <p className="mt-2 text-sm text-gray-500">We've crawled 61 pages and found 0 blocked pages for a total of 61 pages discovered.</p>
                    
                    <div className="border-b mt-8 border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Page Status</h3>
                    </div>
                    <ul className='mt-4'>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-green-500 rounded-full inline-block'></span>
                            Successful: <strong>59</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-teal-500 rounded-full inline-block'></span>
                            Redirects: <strong>0</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-orange-500 rounded-full inline-block'></span>
                            Broken: <strong>2</strong>
                        </li>
                        <li className='flex items-center gap-2'>
                            <span className='h-4 w-4 bg-red-500 rounded-full inline-block'></span>
                            Blocked: <strong>0</strong>
                        </li>
                    </ul>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 border-t text-sm">
                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 p-4 my-4 ">
                            View All Pages
                        </a>
                    </div>
                  </div>
                  <div className="flex flex-col bg-white p-8 relative">
                    
                    <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h2 className="text-xl font-bold leading-6 text-gray-900">SEO Issues Discovered</h2>
                    </div>
                    <p className="mt-4 text-3xl font-bold">12</p>
                    
                    <div className="border-b border-gray-200 mt-8 pb-5 sm:flex sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Top SEO Issues</h3>
                    </div>
                    <ul className='divide-y divide-gray-200'>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> without a H1 heading
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>1 pages</a> with broken links
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                        <li className='whitespace-nowrap py-4 pl-4 pr-3 text-sm  text-gray-900 sm:pl-0'>
                            <a href="#" className='text-indigo-600 hover:text-indigo-500'>26 pages</a> with no meta description
                            <a href="#" className='text-indigo-600 hover:text-indigo-500 float-right'>View Details</a>
                        </li>
                    </ul>
                    <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6 border-t text-sm">
                        <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                            View All Issues
                        </a>
                    </div>
                  </div>
            </div>
            <div className="bg-white mt-8 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl  ring-slate-900/10 ring-1 p-8">
                <h2 className="text-xl font-bold leading-6 text-gray-900">Site Speed - Powered by Google Lighthouse</h2>                   
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
                                        ? getActiveScoreColor(parseInt(stat.value))
                                        : `${getScoreBGColor(parseInt(stat.value))} ${getScoreColor(parseInt(stat.value))}`
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
