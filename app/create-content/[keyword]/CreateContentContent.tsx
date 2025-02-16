'use client';

import { useState } from 'react';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { ContentBrief } from '@/components/ui/ContentBrief';
import { UrlModal } from '@/components/ui/UrlModal';
import { toast } from '@/components/ui/Toasts/use-toast';
import { useRouter } from 'next/navigation';

interface KeywordData {
  keyword: string;
  search_volume: number;
  rank: number | null;
  current_ranking: boolean;
  competitor_ranks: number[];
}

export default function CreateContentContent({ user, keyword }: { user: User, keyword: string }) {
  const [loading, setLoading] = useState(false);
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const supabase = createClientComponentClient();
  const decodedKeyword = decodeURIComponent(keyword);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleContentCompleted = async (url: string, title: string) => {
    try {
      const { error: contentError, data: newContent } = await supabase
        .from('content')
        .insert({
          user_id: user?.id,
          url,
          title,
          status: 'published',
        }).select();

      if (contentError) throw contentError;

      const { error: keywordError } = await supabase
        .from('keyword_suggestions')
        .update({ 
          content_completed: true
        })
        .eq('user_id', user?.id)
        .eq('keyword', decodedKeyword);

      if (keywordError) throw keywordError;

      toast({
        title: 'Success',
        description: 'Content has been marked as completed and keyword updated.',
      });
      setIsModalOpen(false);
      // Call the index-site API
      const indexResponse = await fetch('/api/index-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          contentId: newContent[0].id
        })
      });

      if (!indexResponse.ok) {
        console.error('Failed to index site:', await indexResponse.text());
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark content as completed.',
        variant: 'destructive'
      });
    }
  };

  const handleMuteKeyword = async () => {
    try {
      const { error: muteError } = await supabase
        .from('muted_keywords')
        .insert({ 
          user_id: user?.id,
          keyword: decodedKeyword
        });

      if (muteError) throw muteError;

      toast({
        title: 'Success',
        description: 'Keyword has been muted and won\'t appear in recommendations.',
      });
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to mute keyword.',
        variant: 'destructive'
      });
    }
  };

  const handleCreateNow = () => {
    router.push(`/content-pricing/${encodeURIComponent(decodedKeyword)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ">
      <div className="mb-8 relative ">
        <UrlModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleContentCompleted}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Keyword: {decodedKeyword}</h1>
        <div className="flex gap-2 absolute top-0 right-0">
        <button
                onClick={handleMuteKeyword}
                className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Mute Recommendation
              </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className=" rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          Mark as Complete
        </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Search Volume</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {keywordData?.search_volume.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Your Ranking</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {keywordData?.rank ? `#${keywordData.rank}` : 'Not Ranking'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Competitor Rankings</h2>
            <p className="text-3xl font-bold text-indigo-600">
              {keywordData?.competitor_ranks && keywordData.competitor_ranks.length > 0
                ? `Top: #${Math.min(...keywordData.competitor_ranks)}`
                : 'None'}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <ContentBrief keyword={decodedKeyword} userId={user.id} />
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight border-b border-gray-200 pb-4 mb-4">Create with Espy Go</h2>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Skip the Search for Writers. We'll Craft Your Ranking Content in 48 Hours</h2>
        <div className="prose max-w-none">
          <p className="font-semibold mb-4">We transform your brief into high-ranking content by analyzing what's already working. Our scientific approach:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Analyzes the top 10 ranking articles for your target keyword</li>
            <li>Identifies what Google considers comprehensive coverage</li>
            <li>Blends winning content patterns with your unique business value</li>
            <li>Delivers publication-ready content in just 48 hours</li>
            <li>Structures content for both readers and search engines</li>
          </ul>
          <p className="font-semibold mb-4">Instead of:</p>

          <ul className="list-disc pl-6 mb-6">
            <li>Guessing what content elements help articles rank</li>
            <li>Missing key topics that top-ranking articles cover</li>
            <li>Writing without insight into what Google rewards</li>
            <li>Managing writers who don't understand SEO</li>
            <li>Spending hours analyzing top-ranking content yourself</li>
          </ul>
          <h3 className="text-xl font-semibold mb-4  border-b border-gray-200 pb-4">Why start from scratch? We analyze what's already ranking and create content that matches Google's preferences while showcasing your business expertise. All delivered in 48 hours.</h3>
              <button
                onClick={handleCreateNow}
                className="mb-4 flex w-full justify-center rounded-md bg-indigo-600 p-3 text-lg font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create Now
              </button>
        </div>
      </div>
        </div>
    </div>
  );
} 