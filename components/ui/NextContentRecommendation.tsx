import { useState } from 'react';
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

export const NextContentRecommendation = ({ contentRecommendation, userId }: NextContentRecommendationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const currentPath = usePathname();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClientComponentClient();

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
      const { error: contentError } = await supabase
        .from('content')
        .insert({
          user_id: userId,
          url,
          title,
          target_keyword: contentRecommendation[0].keyword,
          status: 'published',
          secondary_keywords: [] // Add secondary keywords if available
        });

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
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark content as completed.',
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
      <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-900/10">
        <div className="p-6 relative">
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
                <p className="mt-2 text-sm text-gray-500 capitalize">
                  {!isNaN(parseFloat(contentRecommendation[0].competition)) ? getCompetitionLevel(contentRecommendation[0].competition) : contentRecommendation[0].competition.toLowerCase()}
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
              <button
                onClick={() => setIsModalOpen(true)}
                className=" rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 absolute top-10 right-6"
              >
                Mark as Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};