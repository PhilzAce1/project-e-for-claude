import { useState, useEffect } from 'react';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { LoadingOverlay } from './LoadingOverlay';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UrlModal } from './UrlModal';

// Helper function to convert competition float to readable text
const getCompetitionLevel = (competition: number): string => {
  if (competition >= 0.8) return "Very High";
  if (competition >= 0.6) return "High";
  if (competition >= 0.4) return "Medium";
  if (competition >= 0.2) return "Low";
  return "Very Low";
};

interface NextContentRecommendationProps {
  contentRecommendation: any;
  userId: string;
  onUpdate: () => void;
}


export const NextContentRecommendation = ({ contentRecommendation, userId, onUpdate }: NextContentRecommendationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentBrief, setContentBrief] = useState<any>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkExistingRecommendation = async () => {
      if (!contentRecommendation?.[0]?.keyword) return;

      setIsLoadingBrief(true);
      try {
        const { data, error } = await supabase
          .from('content_recommendations')
          .select('*')
          .eq('keyword', contentRecommendation[0].keyword)
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // console.error('Error checking recommendations:', error);
          return;
        }

        if (data) {
          // Use existing recommendation
          setContentBrief(data);
        } else {
          // No existing recommendation found, call the API
          const response = await fetch('/api/get-detailed-content-recommendation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keyword: contentRecommendation[0].keyword,
              user_id: userId
            })
          });

          if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
          }

          const result = await response.json();
          setContentBrief(result.data);
        }
      } catch (error) {
        // console.error('Error creating content recommendation:', error);
        toast({
          title: 'Error',
          description: 'Failed to create content recommendation.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingBrief(false);
      }
    };

    checkExistingRecommendation();
  }, [contentRecommendation, userId, supabase, toast]);

  const handleCreateContent = (keyword: string) => {
    router.push(`/create-content/${encodeURIComponent(keyword)}`);
  };

  const handleContentCompleted = async (url: string, title: string) => {
    try {
      const { error: contentError, data: newContent } = await supabase
        .from('content')
        .insert({
          user_id: userId,
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
        .eq('user_id', userId)
        .eq('keyword', contentRecommendation[0].keyword);

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
        // console.error('Failed to index site:', await indexResponse.text());
      }
      
    } catch (error) {
      // console.error('Error:', error);
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
          user_id: userId,
          keyword: contentRecommendation[0].keyword
        });

      if (muteError) throw muteError;

      toast({
        title: 'Success',
        description: 'Keyword has been muted and won\'t appear in recommendations.',
      });
      
      onUpdate();
      
    } catch (error) {
      // console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to mute keyword.',
        variant: 'destructive'
      });
    }
  };

  if (!contentRecommendation || !(contentRecommendation.length > 0)) return null;

  return (
    <>
      {isProcessing && <LoadingOverlay />}
      <UrlModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleContentCompleted}
      />
      <div className="relative md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-4 px-8 mt-4 ">
        <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:text-lg sm:tracking-tight">
          Create this content next
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className=" rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 absolute top-4 right-6"
        >
          Mark as Complete
        </button>
      </div>
      <div className="rounded-lg bg-white ring-1 ring-slate-900/10 mb-4 columns-2 gap-4 my-4 p-2">
          <div className="p-6 relative break-inside-avoid ">
            <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight border-b border-gray-200 pb-4">
              Content Opportunity
            </h2>
            <h3 className="text-sm font-medium text-gray-900 mt-4">Potential Reach</h3>
            <p className="mt-2 text-sm text-gray-500 capitalize">
              {contentRecommendation[0]?.search_volume} Searches per Month
            </p>
            <h3 className="text-sm font-medium text-gray-900 mt-4">Competition</h3>
            <p className="mt-2 text-sm text-gray-500 capitalize">
              {!isNaN(parseFloat(contentRecommendation[0]?.competition)) ? getCompetitionLevel(contentRecommendation[0].competition) : contentRecommendation[0].competition.toLowerCase()}
            </p>
          </div>
          <div className="p-6 relative break-inside-avoid ">
          <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight border-b border-gray-200 pb-4">
            Content Brief
          </h2>
            {isLoadingBrief || !contentBrief ? (
              <div className="text-gray-500">Loading content brief...</div>
            ) : (
              <>
                <h3 className="text-sm font-medium text-gray-900 mt-4">Type of Content</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {contentBrief?.analysis.content_type}
                </p>
                <h3 className="mt-4 text-sm font-medium text-gray-900">Content Summary</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">{contentBrief?.analysis.content_brief.summary}</p>

                <h3 className="mt-4 text-sm font-medium text-gray-900">Key Points of Content</h3>
                <ul className="mt-2 text-sm text-gray-500 capitalize pl-4 list-disc">
                  {contentBrief?.analysis.content_brief.key_points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul> 
              </>
            )}
          </div>
          <div className="p-6 relative break-inside-avoid ">
            <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight border-b border-gray-200 pb-4">
              Keyword Information
            </h2>
            <h3 className="text-sm font-medium text-gray-900 mt-4">Focus Keyword</h3>
            <p className="mt-2 text-sm text-gray-500 capitalize">
              {contentRecommendation[0]?.keyword}
            </p>
            <h3 className="text-sm font-medium text-gray-900 mt-4">Secondary Keywords</h3>
            <ul className="mt-2 text-sm text-gray-500 capitalize pl-4 list-disc">
              {contentBrief?.analysis.secondary_keywords.map((keyword: string, index: number) => (
                <li key={index}>{keyword}</li>
              ))}
            </ul>
          </div>
          <div className="p-6 relative break-inside-avoid ">
          <h2 className="font-serif text-lg font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight border-b border-gray-200 pb-4">
            Meta Information
          </h2>
          {!contentRecommendation[0] ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Loading recommendation...</div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {isLoadingBrief ? (
                <div className="text-gray-500">Loading content brief...</div>
              ) : contentBrief ? (
                <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Title</h3>
                  <p className="mt-2 text-sm text-gray-500 capitalize">
                    {contentBrief?.analysis.meta_information.title}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Meta Description</h3>
                  <p className="mt-2 text-sm text-gray-500 capitalize">
                    {contentBrief?.analysis.meta_information.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">URL Structure</h3>
                  <p className="mt-2 text-sm text-gray-500 capitalize">
                    {contentBrief?.analysis.url_structure}
                  </p>
                </div>
                </>
              ) : (
                <div className="text-gray-500">No content brief available</div>
              )}
              
              <div>
              <button
                onClick={() => handleCreateContent(contentRecommendation[0].keyword)}
                className="mb-4 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create Content
              </button>
              <button
                onClick={handleMuteKeyword}
                className="w-full rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Mute Recommendation
              </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};