'use client'
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import BusinessProgress from './ui/BusinessProgress';
import { VerificationForm } from '@/components/ui/VerificationForm';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { useParams } from 'next/navigation';
import {BusinessSummary} from './ui/BusinessSummary';

interface BusinessAnalysisProps {
  analysisId: string;
}


export const BusinessAnalysis: React.FC<BusinessAnalysisProps> = ({ analysisId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<any>();
  const { toast } = useToast();
  const [confirmedSections, setConfirmedSections] = useState({
    verification: false,
    critical: false,
    recommended: false
  });
  const [activeSection, setActiveSection] = useState<'verification' | 'critical' | 'recommended'>('verification');

  useEffect(() => {
    const fetchAnalysis = async () => {
      const { data: analysis, error } = await supabase
        .from('business_analyses')
        .select('*, completion_status')
        .eq('id', analysisId)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (analysis) {
        console.log('Analysis set when?', analysis);
        setData(analysis);
        // Set confirmed sections based on completion_status
        if (analysis.completion_status) {
          setConfirmedSections({
            verification: analysis.completion_status.verification || false,
            critical: analysis.completion_status.critical || false,
            recommended: analysis.completion_status.recommended || false
          });
        }
        setLoading(false);
      }
    };

    fetchAnalysis();

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
          console.log('Analysis', analysis);
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
      console.error('Error updating business information:', error);
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
        <h1 className="font-serif text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Business Analysis
        </h1>
      </div>

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
