import { useState } from 'react';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { LoadingOverlay } from './LoadingOverlay';

// Helper function to convert competition float to readable text
const getCompetitionLevel = (competition: number): string => {
  if (competition >= 0.8) return "Very High";
  if (competition >= 0.6) return "High";
  if (competition >= 0.4) return "Medium";
  if (competition >= 0.2) return "Low";
  return "Very Low";
};

export const NextContentRecommendation = ({ contentRecommendation }: { contentRecommendation: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();
  const { toast } = useToast();

  const handleCreateContent = async () => {
    if (!contentRecommendation[0]) return;
    
    setIsProcessing(true);

    try {
      const response = await fetch('/api/get-product-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'prod_RJ5FCKb73rXqQM',
          metadata: {
            keyword: contentRecommendation[0].keyword,
            search_volume: contentRecommendation[0].search_volume,
            competition: contentRecommendation[0].competition,
            main_intent: contentRecommendation[0].main_intent || 'informational',
            content_type: contentRecommendation[0].content_type
          }
        })
      });

      const { price } = await response.json();
      
      if (!price) {
        throw new Error('No price found for this product');
      }

      const { errorRedirect, sessionId } = await checkoutWithStripe(
        price,
        `${currentPath}?keyword=${encodeURIComponent(contentRecommendation[0].keyword)}`
      );

      if (errorRedirect) {
        setIsProcessing(false);
        return router.push(errorRedirect);
      }

      if (!sessionId) {
        throw new Error('No session id returned');
      }

      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });

      setIsProcessing(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  if (!contentRecommendation) return null;

  return (
    <>
      {isProcessing && <LoadingOverlay />}
      <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
        <div className="p-6">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Next Piece of Content to Create
          </h2>

          {!contentRecommendation[0] ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Loading recommendation...</div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Type of Content</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {contentRecommendation[0].content_type}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Potential Reach</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {contentRecommendation[0].search_volume} Searches per Month
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Competition</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {getCompetitionLevel(contentRecommendation[0].competition)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Focus Keyword</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {contentRecommendation[0].keyword}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Content Type</h3>
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {contentRecommendation[0].content_type}
                </p>
              </div>
              <button
                onClick={handleCreateContent}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create with Espy Go
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};