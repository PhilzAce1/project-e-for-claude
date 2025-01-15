import { useState, useEffect } from 'react';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { LoadingOverlay } from './LoadingOverlay';
import { Dialog, Transition } from '@headlessui/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Fragment } from 'react';

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

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, title: string) => void;
}

const UrlModal = ({ isOpen, onClose, onSubmit }: UrlModalProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(url, title);
      setUrl('');
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  Content Completed
                </Dialog.Title>
                <form onSubmit={handleSubmit}>
                  <div className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Content Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                        Content URL
                      </label>
                      <input
                        type="url"
                        id="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="https://example.com/your-content"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

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
          console.error('Error checking recommendations:', error);
          return;
        }

        if (data) {
          // Use existing recommendation
          console.log('Found existing recommendation:', data);
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
          console.log('Content recommendation created:', result);
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
  }, [contentRecommendation, userId, supabase, toast]);

  const handleCreateContent = async () => {
    if (!contentRecommendation?.[0]) return;
    
    setIsProcessing(true);

    try {
      const response = await fetch('/api/get-product-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: 'prod_RJ5FCKb73rXqQM',
          userId,
          metadata: {
            keyword: contentRecommendation[0].keyword,
            search_volume: contentRecommendation[0].search_volume,
            competition: parseFloat(contentRecommendation[0].competition) ? getCompetitionLevel(contentRecommendation[0].competition) : contentRecommendation[0].competition,
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

  const handleContentCompleted = async (url: string, title: string) => {
    try {
      const { error: contentError, data: newContent } = await supabase
        .from('content')
        .insert({
          user_id: userId,
          url,
          title,
          target_keyword: contentRecommendation[0].keyword,
          status: 'published',
          secondary_keywords: [] // Add secondary keywords if available
        }).select();

      if (contentError) throw contentError;

      console.log('New content:', newContent);


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
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to mute keyword.',
        variant: 'destructive'
      });
    }
  };

  if (!contentRecommendation) return null;

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
              {contentRecommendation[0].search_volume} Searches per Month
            </p>
            <h3 className="text-sm font-medium text-gray-900 mt-4">Competition</h3>
            <p className="mt-2 text-sm text-gray-500 capitalize">
              {!isNaN(parseFloat(contentRecommendation[0].competition)) ? getCompetitionLevel(contentRecommendation[0].competition) : contentRecommendation[0].competition.toLowerCase()}
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
              {contentRecommendation[0].keyword}
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
                onClick={handleCreateContent}
                className="mb-4 flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create with Espy Go
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