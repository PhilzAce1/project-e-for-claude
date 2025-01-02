import { CheckIcon } from '@heroicons/react/20/solid';

interface BusinessProgressProps {
  verificationQuestions: any[];
  informationNeeded: {
    critical: any[];
    recommended: any[];
  };
  confirmedSections: {
    verification: boolean;
    critical: boolean;
    recommended: boolean;
  };
  activeSection: 'verification' | 'critical' | 'recommended';
  onSectionClick: (section: 'verification' | 'critical' | 'recommended') => void;
}

export default function BusinessProgress({ 
  verificationQuestions, 
  informationNeeded,
  confirmedSections,
  activeSection,
  onSectionClick
}: BusinessProgressProps) {
  // Helper function to check if a section is complete
  const isSectionComplete = (section: any[]) => {
    return section.every(item => {
      if (typeof item.currentValue === 'object' && !Array.isArray(item.currentValue)) {
        return Object.values(item.currentValue).some((arr: any) => arr.length > 0);
      }
      return Array.isArray(item.currentValue) && item.currentValue.length > 0;
    });
  };

  // Calculate progress percentage for each section
  const getProgress = (section: string) => {
    let questions;
    switch(section) {
      case 'verification':
        questions = verificationQuestions;
        break;
      case 'critical':
        questions = informationNeeded?.critical;
        break;
      case 'recommended':
        questions = informationNeeded?.recommended;
        break;
      default:
        return 0;
    }

    const completed = questions?.filter(q => {
      if (typeof q.currentValue === 'object' && !Array.isArray(q.currentValue)) {
        return Object.values(q.currentValue).some((arr: any) => arr.length > 0);
      }
      return Array.isArray(q.currentValue) && q.currentValue.length > 0;
    }).length;

    return Math.round((completed / questions?.length) * 100);
  };

  const steps = [
    {
      name: 'Verify Information',
      description: 'Confirm what we found about your business',
      section: 'verification',
      questions: verificationQuestions
    },
    {
      name: 'Required Details',
      description: 'Fill in essential information',
      section: 'critical',
      questions: informationNeeded?.critical
    },
    {
      name: 'Additional Information',
      description: 'Add any other helpful details',
      section: 'recommended',
      questions: informationNeeded?.recommended
    }
  ];

  return (
    <div>
      <h2 className="text-base font-semibold leading-6 text-gray-900 mb-4">Your Progress</h2>
      <nav aria-label="Progress">
        <ol role="list" className="overflow-hidden">
          {steps.map((step, stepIdx) => {
            const progress = getProgress(step.section);
            const isComplete = confirmedSections[step.section as keyof typeof confirmedSections];
            const isCurrent = !isComplete && step.section === activeSection;
            const isUpcoming = !isComplete && progress === 0;
            const canNavigate = isComplete || step.section === activeSection;

            return (
              <li 
                key={step.name} 
                className={`
                  ${stepIdx !== steps.length - 1 ? 'pb-10' : ''}
                  ${canNavigate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                `}
                onClick={() => canNavigate && onSectionClick(step.section as 'verification' | 'critical' | 'recommended')}
              >
                <div className="relative">
                  {stepIdx !== steps.length - 1 ? (
                    <div 
                      className={`absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 ${
                        isComplete ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                      aria-hidden="true" 
                    />
                  ) : null}
                  
                  <div className="group relative flex items-start">
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className={`
                        relative z-10 flex h-8 w-8 items-center justify-center rounded-full
                        ${isComplete ? 'bg-indigo-600' : 
                          isCurrent ? 'border-2 border-indigo-600 bg-white' : 
                          'border-2 border-gray-300 bg-white'}
                      `}>
                        {isComplete ? (
                          <CheckIcon className="h-5 w-5 text-white" />
                        ) : (
                          <span className={`h-2.5 w-2.5 rounded-full ${isCurrent ? 'bg-indigo-600' : 'bg-transparent'}`} />
                        )}
                      </span>
                    </span>
                    
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-medium ${
                          isComplete ? 'text-indigo-600' : 
                          isCurrent ? 'text-gray-900' : 
                          'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                        {console.log(typeof progress)}
                        {!isNaN(progress) && (
                          <span className={`
                            inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
                            ${isComplete ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}
                          `}>
                          {progress}%
                        </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{step.description}</p>
                      
                      <p className="text-sm text-gray-400 mt-1">
                        {step.questions?.filter(q => {
                          if (typeof q.currentValue === 'object' && !Array.isArray(q.currentValue)) {
                            return Object.values(q.currentValue).some((arr: any) => arr.length > 0);
                          }
                          return Array.isArray(q.currentValue) && q.currentValue.length > 0;
                        }).length} of {step.questions?.length} questions completed
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
