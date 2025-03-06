'use client'
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BusinessProgress from './ui/BusinessProgress';
import { VerificationForm } from '@/components/ui/VerificationForm';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useParams } from 'next/navigation';
import { BusinessSummary } from './ui/BusinessSummary';
import { CountrySelector } from './ui/CountrySelector';
import { GlobeAltIcon, PencilIcon } from '@heroicons/react/24/outline';
import { priorityCountries, otherCountries } from '@/utils/countries';
import { handleCountrySelect } from '@/utils/supabase/country';

interface BusinessAnalysisProps {
  analysisId: string;
}

// Add country name lookup helper
const getCountryName = (countryCode: string) => {
  const country = [...priorityCountries, ...otherCountries].find(c => c.code === countryCode);
  return country ? country.name : countryCode;
};

export const BusinessAnalysis: React.FC<BusinessAnalysisProps> = ({ analysisId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [targetCountry, setTargetCountry] = useState<string | null>(null);
  const supabase = createClientComponentClient<any>();
  const { toast } = useToast();
  const [confirmedSections, setConfirmedSections] = useState({
    verification: false,
    critical: false,
    recommended: false
  });
  const [activeSection, setActiveSection] = useState<'verification' | 'critical' | 'recommended'>('verification');

  useEffect(() => {
    const fetchData = async () => {
      const [analysisResponse, businessInfoResponse] = await Promise.all([
        supabase
          .from('business_analyses')
          .select('*, completion_status, status')
          .eq('id', analysisId)
          .single(),
        supabase
          .from('business_information')
          .select('target_country')
          .single()
      ]);

      if (analysisResponse.error) {
        toast({
          title: 'Error',
          description: analysisResponse.error.message,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (businessInfoResponse.data?.target_country) {
        setTargetCountry(businessInfoResponse.data.target_country);
      }

      if(analysisResponse.data.status === 'completed') {
        channel.unsubscribe();
      }

      if (analysisResponse.data) {
        setData(analysisResponse.data);
        // Set confirmed sections based on completion_status
        if (analysisResponse.data.completion_status) {
          setConfirmedSections({
            verification: analysisResponse.data.completion_status.verification || false,
            critical: analysisResponse.data.completion_status.critical || false,
            recommended: analysisResponse.data.completion_status.recommended || false
          });
        }
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_analyses',
          filter: `id=eq.${analysisId}`
        },
        (payload: any) => {
          const analysis = payload.new;
          
          setData(analysis);
          
          // Update confirmed sections when changes occur
          if (analysis.completion_status) {
            setConfirmedSections({
              verification: analysis.completion_status.verification || false,
              critical: analysis.completion_status.critical || false,
              recommended: analysis.completion_status.recommended || false
            });
          }

          if (analysis.status === 'failed') {
            toast({
              title: 'Analysis Failed',
              description: analysis.error_message || 'Analysis failed',
              variant: 'destructive'
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [analysisId, supabase, toast]);

  const handleSubmit = async (formData: {
    verification_questions: any[];
    information_needed: {
      critical: any[];
      recommended: any[];
    }
  }) => {
    try {
      // First save the form data
      const { error } = await supabase
        .from('business_analyses')
        .update({
          verification_questions: formData.verification_questions,
          information_needed: formData.information_needed,
          status: 'completed'
        })
        .eq('id', analysisId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Information updated and keywords generated successfully'
      });
      
    } catch (error: any) {
      // console.error('Error updating business information:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update information',
        variant: 'destructive'
      });
    }
  };

  const handleSectionChange = (section: 'verification' | 'critical' | 'recommended') => {
    // Only allow navigation to completed sections or the next available section
    const canNavigate = confirmedSections[section] || (
      section === 'verification' ||
      (section === 'critical' && confirmedSections.verification) ||
      (section === 'recommended' && confirmedSections.critical)
    );

    if (canNavigate) {
      setActiveSection(section);
    }
  };

  const handleCountryUpdate = async (country: string) => {
    await handleCountrySelect(data.user_id, country, () => {
      setTargetCountry(country);
      setShowCountrySelector(false);
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );

  if (!data) return null;

  return (
    <div className="container mx-auto">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between w-full overflow-hidden rounded-lg ring-1 bg-white ring-slate-900/10 p-8">
        <div>
          <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Business Analysis
          </h1>
          {targetCountry && (
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <GlobeAltIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span>Targeting: {getCountryName(targetCountry)}</span>
              <button
                onClick={() => setShowCountrySelector(true)}
                className="ml-2 inline-flex items-center rounded-md bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <CountrySelector 
        isOpen={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSubmit={handleCountryUpdate}
        initialCountry={targetCountry || 'GB'}
      />

      {/* Show form if any section is incomplete */}
      {(!confirmedSections.critical || !confirmedSections.recommended || !confirmedSections.verification) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="mt-5 col-span-2 relative bg-gray-900 px-6 py-16 text-center shadow-2xl sm:rounded-xl sm:px-8">
            <VerificationForm 
              analysisId={analysisId} 
              questions={data.verification_questions}
              informationNeeded={data.information_needed}
              onSubmit={handleSubmit}
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onSectionConfirm={(section) => {
                setConfirmedSections(prev => ({
                  ...prev,
                  [section]: true
                }));
                if (section === 'verification') {
                  setActiveSection('critical');
                } else if (section === 'critical') {
                  setActiveSection('recommended');
                }
              }}
              status={data.status}
              progress={data.progress}
            />
          </div>
          
          <div className="mt-5">
            <div className="sticky top-4 overflow-hidden rounded-lg bg-white shadow ring-slate-900/10 p-8">
              <BusinessProgress 
                verificationQuestions={data.verification_questions}
                informationNeeded={data.information_needed}
                confirmedSections={confirmedSections}
                activeSection={activeSection}
                onSectionClick={handleSectionChange}
              />
              </div>
            <div className="sticky top-4 overflow-hidden rounded-lg bg-white shadow ring-slate-900/10 p-8 mt-4">
              <h2 className="text-lg font-bold">Why is this important?</h2>
              <p className="text-sm text-gray-600">
                This is one of the most important steps in the process. It helps us understand your business which in turn helps us create the best opportunities for you to rank well.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show summary if all sections are complete */}
      {(confirmedSections.critical && confirmedSections.recommended && confirmedSections.verification) && (
        <div className="my-6 pb-1">
          <BusinessSummary analysisId={analysisId} />
        </div>
      )}
    </div>
  );
};
