import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as Tooltip from '@radix-ui/react-tooltip';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { fieldContexts } from '@/utils/business-analyzer/types';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface VerificationFormProps {
  analysisId: string;
  questions: any[];
  informationNeeded: {
    critical: any[];
    recommended: any[];
  };
  onSubmit: (data: any) => void;
  onSectionConfirm: (section: 'verification' | 'critical' | 'recommended') => void;
  onSectionChange: (section: 'verification' | 'critical' | 'recommended') => void;
  activeSection: 'verification' | 'critical' | 'recommended';
  status: string;
  progress: string;
}

interface BusinessAnalysisAnswer {
  analysis_id: string;
  category: 'marketPosition' | 'technicalSpecifics' | 'coreBusiness' | 'customerJourney';
  field_name: string;
  section: 'verification' | 'critical' | 'recommended';
  answer: any;
  confidence: number;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({ 
  analysisId, 
  questions, 
  informationNeeded, 
  onSubmit,
  onSectionConfirm,
  onSectionChange,
  activeSection,
  status,
  progress,
}) => {
  const supabase = createClientComponentClient()
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    verification_questions: questions,
    information_needed: informationNeeded
  });

  const [confirmedSections, setConfirmedSections] = useState({
    verification: false,
    critical: false,
    recommended: false
  });

  const [isAdding, setIsAdding] = useState(false);

  // Add refs for each section
  const verificationRef = useRef<HTMLDivElement>(null);
  const criticalRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  // Add this state near the top of the component
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      verification_questions: questions,
      information_needed: informationNeeded
    })
  }, [questions, informationNeeded])

  // Scroll to active section when it changes
  useEffect(() => {
    const refs = {
      verification: verificationRef,
      critical: criticalRef,
      recommended: recommendedRef
    };

    const activeRef = refs[activeSection];
    if (activeRef?.current) {
      activeRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeSection]);

  // Helper function to check if a section is complete
  const isSectionComplete = (section: any[]) => {
    return section?.every(item => {
      if (typeof item.currentValue === 'object' && !Array.isArray(item.currentValue)) {
        // For object type, check if any array in the object has values
        return Object.values(item.currentValue).some((arr: any) => arr.length > 0);
      }
      // For array type
      return Array.isArray(item.currentValue) && item.currentValue.length > 0;
    });
  };

  const handleAddItem = (section: string, questionIndex: number, key?: string) => {
    setFormData(prev => {
      const newData = structuredClone(prev); // Deep clone to ensure we get a fresh copy
      
      if (section === 'critical' || section === 'recommended') {
        const targetQuestion = newData.information_needed[section][questionIndex];
        if (key && targetQuestion.currentValue[key]) {
          // Ensure we're working with a fresh array
          const currentArray = Array.from(targetQuestion.currentValue[key]);
          targetQuestion.currentValue[key] = [...currentArray, ''];
        }
      } else {
        const targetQuestion = newData.verification_questions[questionIndex];
        if (targetQuestion.currentValue.type === 'list') {
          // Ensure we're working with a fresh array
          const currentItems = Array.from(targetQuestion.currentValue.items);
          targetQuestion.currentValue.items = [...currentItems, ''];
        } else if (targetQuestion.currentValue.type === 'object' && key) {
          const item = targetQuestion.currentValue.items.find((i: any) => i.key === key);
          if (item) {
            // Ensure we're working with a fresh array
            const currentValues = Array.from(item.value);
            item.value = [...currentValues, ''];
          }
        }
      }

      return newData;
    });
  };

  const handleRemoveItem = (section: string, questionIndex: number, itemIndex: number, key?: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (section === 'critical' || section === 'recommended') {
        const targetQuestion = newData.information_needed[section][questionIndex];
        if (key && targetQuestion.currentValue[key]) {
          targetQuestion.currentValue[key].splice(itemIndex, 1);
        }
      } else {
        const targetQuestion = newData.verification_questions[questionIndex];
        if (targetQuestion.currentValue.type === 'list') {
          targetQuestion.currentValue.items.splice(itemIndex, 1);
        } else if (targetQuestion.currentValue.type === 'object' && key) {
          const item = targetQuestion.currentValue.items.find((i: any) => i.key === key);
          if (item) {
            item.value.splice(itemIndex, 1);
          }
        }
      }

      return newData;
    });
  };

  const handleUpdateItem = async (section: string, questionIndex: number, itemIndex: number, value: string, key?: string) => {
    try {
      setFormData(prev => {
        const newData = { ...prev };
        let targetQuestion;
        
        if (section === 'critical' || section === 'recommended') {
          targetQuestion = newData.information_needed[section][questionIndex];
        } else {
          targetQuestion = newData.verification_questions[questionIndex];
        }

        // Update the form state as before
        if (section === 'critical' || section === 'recommended') {
          if (key && targetQuestion.currentValue[key]) {
            targetQuestion.currentValue[key][itemIndex] = value;
          }
        } else {
          if (targetQuestion.currentValue.type === 'list') {
            targetQuestion.currentValue.items[itemIndex] = value;
          } else if (targetQuestion.currentValue.type === 'object' && key) {
            const item = targetQuestion.currentValue.items.find((i: any) => i.key === key);
            if (item) {
              item.value[itemIndex] = value;
            }
          }
        }

        return newData;
      });
    } catch (error: any) {
      console.error('Error updating answer:', error);
      toast({
        title: 'Error updating answer',
        description: error.message || 'Failed to save your answer',
        variant: 'destructive',
      });
    }
  };

  const renderQuestionFields = (question: any, questionIndex: number, section: string) => {
    // For verification questions
    if (section === 'verification') {
      const context = fieldContexts[question.field];

      // Handle list type
      if (question.currentValue.type === 'list') {
        return (
          <div className="space-y-6">
            {/* Add main field context if available */}
            {context?.description && (
              <div className="text-sm text-gray-400 mb-4">
                <p>{context.description}</p>
              </div>
            )}

            <div className="space-y-2">
              {question.currentValue.items.map((value: string, valueIndex: number) => (
                <div key={valueIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateItem(section, questionIndex, valueIndex, e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                    placeholder="Add your answer..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(section, questionIndex, valueIndex)}
                    className="rounded-md bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem(section, questionIndex)}
                className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" /> Add Item
              </button>
            </div>
          </div>
        );
      }

      // Handle object type (existing code)
      if (question.currentValue.type === 'object') {
        return (
          <div className="space-y-6">
            {/* Add main field context if available */}
            {context?.description && (
              <div className="text-sm text-gray-400 mb-4">
                <p>{context.description}</p>
              </div>
            )}

            {question.currentValue.items.map((item: any) => (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded">
                  <h4 className="text-sm font-medium text-gray-400">
                    {item.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </h4>
                  
                  {/* Add tooltip if we have context for this subsection */}
                  {context?.subsections?.[item.key] && (
                    <Tooltip.Provider>
                      <Tooltip.Root 
                        open={activeTooltip === `${section}-${questionIndex}-${item.key}`}
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveTooltip(`${section}-${questionIndex}-${item.key}`);
                          } else {
                            setActiveTooltip(null);
                          }
                        }}
                      >
                        <Tooltip.Trigger asChild>
                          <button 
                            className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-white/5"
                            type="button"
                            onClick={() => {
                              if (activeTooltip === `${section}-${questionIndex}-${item.key}`) {
                                setActiveTooltip(null);
                              } else {
                                setActiveTooltip(`${section}-${questionIndex}-${item.key}`);
                              }
                            }}
                          >
                            <InformationCircleIcon className="h-5 w-5" />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="max-w-xs bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg"
                            sideOffset={5}
                            onPointerDownOutside={() => setActiveTooltip(null)}
                          >
                            <div className="space-y-2">
                              <p className="text-sm">{context.subsections[item.key].description}</p>
                              {context.subsections[item.key].examples.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Examples:</p>
                                  <ul className="text-xs text-gray-300 list-disc list-inside">
                                    {context.subsections[item.key].examples.map((example, i) => (
                                      <li key={i}>{example}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  )}
                </div>
                
                {Array.isArray(item.value) && (
                  <div className="space-y-2">
                    {item.value.map((value: string, valueIndex: number) => (
                      <div key={valueIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleUpdateItem(section, questionIndex, valueIndex, e.target.value, item.key)}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                          placeholder={getPlaceholder(question.field, item.key)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(section, questionIndex, valueIndex, item.key)}
                          className="rounded-md bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddItem(section, questionIndex, item.key)}
                      className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    >
                      <PlusIcon className="h-4 w-4" /> Add {item.key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    }

    // For critical and recommended sections
    if (section === 'critical' || section === 'recommended') {
      const currentValue = question.currentValue;
      
      // Handle simple array
      if (Array.isArray(currentValue)) {
        return (
          <div className="space-y-6">
            {/* Add main field context if available */}
            {fieldContexts[question.field]?.description && (
              <div className="text-sm text-gray-400 mb-4">
                <p>{fieldContexts[question.field].description}</p>
              </div>
            )}

            <div className="space-y-2">
              {currentValue.map((value: string, valueIndex: number) => (
                <div key={valueIndex} className="flex gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateItem(section, questionIndex, valueIndex, e.target.value)}
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                    placeholder="Add your answer..."
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(section, questionIndex, valueIndex)}
                    className="rounded-md bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem(section, questionIndex)}
                className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" /> Add Item
              </button>
            </div>
          </div>
        );
      }

      // Handle object type (existing code)
      if (typeof currentValue === 'object' && !Array.isArray(currentValue)) {
        const context = fieldContexts[question.field];

        return (
          <div className="space-y-6">
            {/* Add main field context if available */}
            {context?.description && (
              <div className="text-sm text-gray-400 mb-4">
                <p>{context.description}</p>
              </div>
            )}

            {Object.entries(currentValue).map(([key, values]: [string, any]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 border border-white/10 p-2 rounded">
                  <h4 className="text-sm font-medium text-gray-400">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </h4>
                  
                  {/* Add tooltip if we have context for this subsection */}
                  {context?.subsections?.[key] && (
                    <Tooltip.Provider>
                      <Tooltip.Root 
                        open={activeTooltip === `${section}-${questionIndex}-${key}`}
                        onOpenChange={(open) => {
                          if (open) {
                            setActiveTooltip(`${section}-${questionIndex}-${key}`);
                          } else {
                            setActiveTooltip(null);
                          }
                        }}
                      >
                        <Tooltip.Trigger asChild>
                          <button 
                            className="text-gray-400 hover:text-gray-300 p-1 rounded-full hover:bg-white/5"
                            type="button"
                            onClick={() => {
                              if (activeTooltip === `${section}-${questionIndex}-${key}`) {
                                setActiveTooltip(null);
                              } else {
                                setActiveTooltip(`${section}-${questionIndex}-${key}`);
                              }
                            }}
                          >
                            <InformationCircleIcon className="h-5 w-5" />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="max-w-xs bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg"
                            sideOffset={5}
                            onPointerDownOutside={() => setActiveTooltip(null)}
                          >
                            <div className="space-y-2">
                              <p className="text-sm">{context.subsections[key].description}</p>
                              {context.subsections[key].examples.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Examples:</p>
                                  <ul className="text-xs text-gray-300 list-disc list-inside">
                                    {context.subsections[key].examples.map((example, i) => (
                                      <li key={i}>{example}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  )}
                </div>

                {Array.isArray(values) && (
                  <div className="space-y-2">
                    {values.map((value: string, valueIndex: number) => (
                      <div key={valueIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleUpdateItem(section, questionIndex, valueIndex, e.target.value, key)}
                          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm/6"
                          placeholder={getPlaceholder(question.field, key)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(section, questionIndex, valueIndex, key)}
                          className="rounded-md bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddItem(section, questionIndex, key)}
                      className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    >
                      <PlusIcon className="h-4 w-4" /> Add {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    }
  };

  // Helper function to get contextual placeholders
  const getPlaceholder = (field: string, key: string): string => {
    const context = fieldContexts[field]?.subsections?.[key];
    if (context?.examples?.[0]) {
      return `e.g., "${context.examples[0]}"`;
    }
    return 'Add your answer...';
  };

  // Update the button click handlers to use onSectionConfirm
  const handleSectionConfirm = async (section: 'verification' | 'critical' | 'recommended') => {
    try {
      if (!analysisId) {
        throw new Error('Analysis ID is required');
      }

      // Get all questions for this section
      const questions = section === 'verification' 
        ? formData.verification_questions 
        : formData.information_needed[section];

      // Prepare all answers
      const answers = questions.map(question => ({
        analysis_id: analysisId,
        category: question.category,
        field_name: question.field,
        section,
        answer: question.currentValue,
        confidence: question.confidence || 0
      }));

      // Save answers and update completion status
      const { error } = await supabase.rpc('update_analysis_section', {
        p_analysis_id: analysisId,
        p_section: section,
        p_answers: answers
      });

      if (error) throw error;

      // Update UI state
      onSectionConfirm(section);
      
      toast({
        title: 'Section completed',
        description: `${section.charAt(0).toUpperCase() + section.slice(1)} section saved successfully`,
      });

      // Move to next section or competitors page
      if (section === 'verification') {
        onSectionChange('critical');
      } else if (section === 'critical') {
        onSectionChange('recommended');
      } else if (section === 'recommended') {
        // Redirect to competitors page
        window.location.href = '/competitors';
      }

    } catch (error: any) {
      console.error('Error confirming section:', error);
      toast({
        title: 'Error saving section',
        description: error.message || 'Failed to save section',
        variant: 'destructive',
      });
    }
  };

  // Check for empty sections and auto-confirm them
  useEffect(() => {
    const autoConfirmEmptySections = async () => {
      // Only proceed if status is 'completed'
      if (status !== 'completed') {
        return;
      }

      try {
        if (activeSection === 'verification' && (!questions || questions.length === 0)) {
          console.log('Verification questions empty, auto-confirming...');
          await handleSectionConfirm('verification');
        } else if (activeSection === 'critical' && (!informationNeeded.critical || informationNeeded.critical.length === 0)) {
          console.log('Critical information empty, auto-confirming...');
          await handleSectionConfirm('critical');
        } else if (activeSection === 'recommended' && (!informationNeeded.recommended || informationNeeded.recommended.length === 0)) {
          console.log('Recommended information empty, auto-confirming...');
          await handleSectionConfirm('recommended');
        }
      } catch (error) {
        console.error('Error auto-confirming empty sections:', error);
      }
    };

    autoConfirmEmptySections();
  }, [activeSection, questions, informationNeeded, status]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(formData);
    }}>
      {status !== 'completed' && (
        <>
        <p className="mb-4 text-lg text-gray-300">
          
          {progress}
        </p>
        <div role="status">
          <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
        </>
      )}
      {/* Only render sections if they have content */}
      {activeSection === 'verification' && questions?.length > 0 && (
        <div ref={verificationRef}>
          <div className="space-y-12 transition-opacity duration-300 ease-in-out">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Let's verify your business information
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                We've gathered some information about your business. Please verify it and fill in any gaps.
              </p>
            </div>

            {formData.verification_questions?.map((question, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6 shadow-sm ring-1 ring-white/10 hover:ring-white/20 transition-all">
                <h3 className="text-xl font-medium text-white mb-4">{question.question}</h3>
                {renderQuestionFields(question, index, 'verification')}
              </div>
            ))}

            {isSectionComplete(formData.verification_questions) && !confirmedSections.verification && (
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => handleSectionConfirm('verification')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Confirm and Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {activeSection === 'critical' && informationNeeded && informationNeeded.critical?.length > 0 && (
        <div ref={criticalRef}>
          <div className="space-y-12 transition-opacity duration-300 ease-in-out">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Required Information
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                We need a few more details to create your personalized strategy.
              </p>
            </div>

            {formData.information_needed.critical.map((question, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6 shadow-sm ring-1 ring-white/10 hover:ring-white/20 transition-all">
                <h3 className="text-xl font-medium text-white mb-4">{question.question}</h3>
                {renderQuestionFields(question, index, 'critical')}
              </div>
            ))}

            {!confirmedSections.critical && (
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => onSectionChange('verification')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSectionConfirm('critical')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Confirm and Continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'recommended' && informationNeeded?.recommended?.length > 0 && (
        <div ref={recommendedRef}>
          <div className="space-y-12 transition-opacity duration-300 ease-in-out">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Additional Information
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                These details will help us provide more targeted recommendations.
              </p>
            </div>

            {formData.information_needed.recommended.map((question, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6 shadow-sm ring-1 ring-white/10 hover:ring-white/20 transition-all">
                <h3 className="text-xl font-medium text-white mb-4">{question.question}</h3>
                {renderQuestionFields(question, index, 'recommended')}
              </div>
            ))}

            {!confirmedSections.recommended && (
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => onSectionChange('critical')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSectionConfirm('recommended')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save All Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
};
