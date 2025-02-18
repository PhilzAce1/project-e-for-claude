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

interface ContentBriefProps {
  keyword: string;
  userId: string;
  onUpdate?: () => void;
}


export const ContentBrief = ({ keyword, userId, onUpdate }: ContentBriefProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contentBrief, setContentBrief] = useState<any>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkExistingRecommendation = async () => {
      if (!keyword) return;

      setIsLoadingBrief(true);
      try {
        const { data, error } = await supabase
          .from('content_recommendations')
          .select('*')
          .eq('keyword', keyword)
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking recommendations:', error);
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
              keyword: keyword,
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
        console.error('Error creating content recommendation:', error);
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
  }, [keyword, userId, supabase, toast]);



  if (!keyword) return null;

  return (
    <>
      {isProcessing && <LoadingOverlay />}
      <div className="rounded-lg bg-white ring-1 ring-slate-900/10  p-2">
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
              {keyword}
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
          {!keyword ? (
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
              
            </div>
          )}
        </div>
      </div>
    </>
  );
};